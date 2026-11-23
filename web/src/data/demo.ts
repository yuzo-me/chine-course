import { db, uid, type CardRow, type ReviewLogRow } from './db'
import type { Content } from './content'
import { applyRating, newCard, type Choice } from '../domain/scheduling'
import { resetAll } from './progress'

/** Заполняет прогресс правдоподобными данными для показа. Сбрасываемо кнопкой «Сбросить». */
export async function fillDemo(content: Content) {
  await resetAll()
  const DAY = 86400000
  const now = Date.now()
  const words = content.words.slice(0, 110)
  const rows: CardRow[] = []
  const logs: ReviewLogRow[] = []
  let seed = 7
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  for (const w of words) {
    let card = newCard(new Date(now - 14 * DAY))
    const start = now - Math.floor(rnd() * 13 + 1) * DAY
    let t = start
    const steps = 1 + Math.floor(rnd() * 5)
    for (let k = 0; k < steps && t <= now; k++) {
      const r = rnd()
      const choice: Choice = r < 0.1 ? 'again' : r < 0.3 ? 'hard' : r < 0.85 ? 'good' : 'easy'
      card = applyRating(card, choice, new Date(t))
      logs.push({ id: uid(), cardId: `${w.id}:hanzi2meaning`, rating: ({ again: 1, hard: 2, good: 3, easy: 4 } as const)[choice], reviewedAt: t, source: 'cards' as const, assisted: false })
      t = Math.max(card.due.getTime(), t + DAY / 2)
    }
    rows.push({ id: `${w.id}:hanzi2meaning`, wordId: w.id, direction: 'hanzi2meaning', due: card.due.getTime(), card, createdAt: start })
  }
  const attempts = words.slice(0, 40).map((w, i) => ({
    id: uid(), type: (['hanzi2meaning', 'meaning2hanzi', 'pinyinInput', 'tone'] as const)[i % 4], wordId: w.id, correct: rnd() > 0.22, assisted: false, answer: '', at: now - Math.floor(rnd() * 6) * DAY,
  }))
  const writing = content.charactersWriting.slice(0, 18).map((c, i) => ({ char: c.char, stage: i < 10 ? ('free' as const) : ('traced' as const), mistakes: Math.floor(rnd() * 4), completedAt: now - i * DAY / 3 }))
  await db.transaction('rw', db.cards, db.reviewLog, db.exerciseAttempts, db.writing, async () => {
    await db.cards.bulkPut(rows); await db.reviewLog.bulkAdd(logs); await db.exerciseAttempts.bulkAdd(attempts); await db.writing.bulkPut(writing)
  })
}
