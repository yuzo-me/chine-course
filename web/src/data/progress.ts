import type { Card } from 'ts-fsrs'
import { db, uid, type AttemptRow, type CardRow, type Direction, type ReviewLogRow } from './db'
import { applyRating, dayStart, isLearned, isStudied, newCard, RATING, type Choice } from '../domain/scheduling'

export const cardId = (wordId: string, d: Direction = 'hanzi2meaning') => `${wordId}:${d}`

/** Записывает оценку карточки: обновляет расписание и журнал. */
export async function reviewCard(wordId: string, choice: Choice, source: 'cards' | 'exercise', assisted = false, now = new Date()) {
  const id = cardId(wordId)
  const existing = await db.cards.get(id)
  const card: Card = existing?.card ?? newCard(now)
  const next = applyRating(card, choice, now, assisted)
  const row: CardRow = { id, wordId, direction: 'hanzi2meaning', due: next.due.getTime(), card: next, createdAt: existing?.createdAt ?? now.getTime() }
  const log: ReviewLogRow = { id: uid(), cardId: id, rating: RATING[choice] as 1 | 2 | 3 | 4, reviewedAt: now.getTime(), source, assisted }
  await db.transaction('rw', db.cards, db.reviewLog, async () => { await db.cards.put(row); await db.reviewLog.add(log) })
  return row
}

/** Результат упражнения: журнал попыток; расписание меняется только у уже изучаемых слов. */
export async function recordAttempt(a: Omit<AttemptRow, 'id' | 'at'>, now = new Date()) {
  await db.exerciseAttempts.add({ ...a, id: uid(), at: now.getTime() })
  if (await db.cards.get(cardId(a.wordId))) {
    await reviewCard(a.wordId, a.correct ? 'good' : 'again', 'exercise', a.assisted, now)
  }
}

/** Добавить слово в изучение (из словаря): карточка станет доступна сегодня. */
export async function addToStudy(wordId: string, now = new Date()) {
  const id = cardId(wordId)
  if (await db.cards.get(id)) return
  const card = newCard(now)
  await db.cards.put({ id, wordId, direction: 'hanzi2meaning', due: now.getTime(), card, createdAt: now.getTime() })
}

export interface Stats {
  studied: number; learned: number; dueToday: number; newToday: number; writtenChars: number; attempts: number; correct: number; reviewsToday: number
}
export async function computeStats(totalWords: number, newPerDay: number, now = Date.now()): Promise<Stats> {
  const cards = await db.cards.toArray()
  const endOfToday = dayStart(now) + 86400000
  const studiedCards = cards.filter((c) => isStudied(c.card))
  const introducedToday = cards.filter((c) => c.createdAt >= dayStart(now)).length
  const dueToday = studiedCards.filter((c) => c.due < endOfToday).length
  const attempts = await db.exerciseAttempts.toArray()
  const writing = await db.writing.toArray()
  const reviewsToday = await db.reviewLog.where('reviewedAt').aboveOrEqual(dayStart(now)).count()
  return {
    studied: studiedCards.length,
    learned: studiedCards.filter((c) => isLearned(c.card)).length,
    dueToday,
    newToday: Math.max(0, Math.min(newPerDay - introducedToday, totalWords - cards.length)),
    writtenChars: writing.filter((w) => w.stage === 'free').length,
    attempts: attempts.length, correct: attempts.filter((a) => a.correct).length, reviewsToday,
  }
}

const EXPORT_TABLES = ['cards', 'reviewLog', 'exerciseAttempts', 'writing', 'settings'] as const
export async function exportProgress(): Promise<string> {
  const out: Record<string, unknown> = { app: 'hsk-trainer', schemaVersion: 1, exportedAt: new Date().toISOString() }
  for (const t of EXPORT_TABLES) out[t] = await db.table(t).toArray()
  return JSON.stringify(out)
}
export async function importProgress(text: string): Promise<{ ok: boolean; message: string }> {
  let data: Record<string, unknown>
  try { data = JSON.parse(text) } catch { return { ok: false, message: 'Файл не похож на резервную копию: его не удалось прочитать.' } }
  if (data.app !== 'hsk-trainer') return { ok: false, message: 'Это не резервная копия тренажёра.' }
  if (data.schemaVersion !== 1) return { ok: false, message: 'Копия сделана другой версией тренажёра, её нельзя загрузить.' }
  let added = 0
  await db.transaction('rw', EXPORT_TABLES.map((t) => db.table(t)), async () => {
    for (const t of EXPORT_TABLES) {
      const rows = data[t]
      if (!Array.isArray(rows)) continue
      const table = db.table(t)
      for (const r of rows as Record<string, unknown>[]) {
        const key = (r.id ?? r.char ?? r.key) as string
        if (t === 'cards' && r.card) {
          const c = r.card as Record<string, unknown>
          c.due = new Date(c.due as string); if (c.last_review) c.last_review = new Date(c.last_review as string)
        }
        const exists = await table.get(key)
        if (!exists) { await table.put(r); added++ }
      }
    }
  })
  return { ok: true, message: `Готово: добавлено записей — ${added}. Существующий прогресс не затронут.` }
}

export async function resetAll() { await Promise.all([db.cards.clear(), db.reviewLog.clear(), db.exerciseAttempts.clear(), db.writing.clear()]) }
