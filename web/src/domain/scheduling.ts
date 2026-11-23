import { createEmptyCard, fsrs, Rating, State, type Card, type Grade } from 'ts-fsrs'

export type Choice = 'again' | 'hard' | 'good' | 'easy'
export const RATING: Record<Choice, Grade> = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy }
export const CHOICE_LABEL: Record<Choice, string> = { again: 'Не помню', hard: 'Трудно', good: 'Помню', easy: 'Легко' }

const scheduler = fsrs()
export const newCard = (now: Date): Card => createEmptyCard(now)

/** Применяет оценку. Ответ «с помощью» не может быть лучше, чем «Трудно». */
export function applyRating(card: Card, choice: Choice, now: Date, assisted = false): Card {
  let c: Choice = choice
  if (assisted && (c === 'good' || c === 'easy')) c = 'hard'
  return scheduler.next(card, now, RATING[c]).card
}

/** Слово закреплено: интервал запоминания не меньше 14 дней. */
export const isLearned = (card: Card) => card.state === State.Review && card.stability >= 14
export const isStudied = (card: Card) => card.reps > 0

export interface QueueCard { id: string; wordId: string; due: number; isNew: boolean }

/** Очередь на сегодня: просроченные по возрасту, затем новые слова (не больше лимита на день). */
export function buildQueue(
  rows: { id: string; wordId: string; due: number }[],
  allWordIds: string[],
  now: number,
  newAllowed: number,
): QueueCard[] {
  const known = new Set(rows.map((r) => r.wordId))
  const due = rows.filter((r) => r.due <= now).sort((a, b) => a.due - b.due).map((r) => ({ ...r, isNew: false }))
  const fresh = allWordIds.filter((id) => !known.has(id)).slice(0, Math.max(0, newAllowed))
    .map((wordId) => ({ id: `${wordId}:hanzi2meaning`, wordId, due: now, isNew: true }))
  return [...due, ...fresh]
}

/** После «Не помню» карточка возвращается в той же сессии, но не сразу: через несколько других. */
export function requeueAfterAgain<T>(queue: T[], item: T, gap = 3): T[] {
  const q = [...queue]
  q.splice(Math.min(gap, q.length), 0, item)
  return q
}

export const dayStart = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime() }
