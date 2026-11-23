import { describe, expect, it } from 'vitest'
import { applyRating, buildQueue, newCard, requeueAfterAgain, isLearned } from './scheduling'

const now = new Date('2026-11-24T10:00:00Z')
describe('scheduling', () => {
  it('«Помню» сдвигает дату дальше, чем «Не помню»', () => {
    const a = applyRating(newCard(now), 'again', now)
    const g = applyRating(newCard(now), 'good', now)
    expect(g.due.getTime()).toBeGreaterThan(a.due.getTime())
  })
  it('«Легко» не раньше, чем «Помню»', () => {
    const g = applyRating(newCard(now), 'good', now)
    const e = applyRating(newCard(now), 'easy', now)
    expect(e.due.getTime()).toBeGreaterThanOrEqual(g.due.getTime())
  })
  it('ответ с помощью не продвигает как «Помню»', () => {
    const helped = applyRating(newCard(now), 'good', now, true)
    const hard = applyRating(newCard(now), 'hard', now)
    expect(helped.due.getTime()).toBe(hard.due.getTime())
  })
  it('новая карточка не считается закреплённой', () => expect(isLearned(newCard(now))).toBe(false))
  it('очередь: сначала просроченные, потом новые в пределах лимита', () => {
    const rows = [
      { id: 'a:hanzi2meaning', wordId: 'a', due: now.getTime() - 1000 },
      { id: 'b:hanzi2meaning', wordId: 'b', due: now.getTime() + 99999 },
    ]
    const q = buildQueue(rows, ['a', 'b', 'c', 'd', 'e'], now.getTime(), 2)
    expect(q.map((x) => x.wordId)).toEqual(['a', 'c', 'd'])
    expect(q[0].isNew).toBe(false)
    expect(q[1].isNew).toBe(true)
  })
  it('«Не помню» возвращает карточку позже в той же сессии', () => {
    expect(requeueAfterAgain([1, 2, 3, 4, 5], 9, 3)).toEqual([1, 2, 3, 9, 4, 5])
    expect(requeueAfterAgain([], 9)).toEqual([9])
  })
})
