import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { addToStudy, computeStats, exportProgress, importProgress, recordAttempt, resetAll, reviewCard } from './progress'

beforeEach(async () => { await resetAll(); await db.settings.clear() })

describe('прогресс', () => {
  it('оценка создаёт карточку и запись в журнале', async () => {
    const row = await reviewCard('W1', 'good', 'cards')
    expect(row.card.reps).toBe(1)
    expect(await db.reviewLog.count()).toBe(1)
  })
  it('«Не помню» назначает повтор раньше, чем «Помню»', async () => {
    const a = await reviewCard('A', 'again', 'cards'); const g = await reviewCard('G', 'good', 'cards')
    expect(a.due).toBeLessThan(g.due)
  })
  it('статистика считает изученные слова и повторы на сегодня', async () => {
    await reviewCard('A', 'again', 'cards'); await reviewCard('B', 'easy', 'cards')
    const s = await computeStats(300, 10)
    expect(s.studied).toBe(2)
    expect(s.dueToday).toBeGreaterThanOrEqual(1)
    expect(s.newToday).toBe(8)
  })
  it('слово из словаря не считается изученным, пока не оценено', async () => {
    await addToStudy('X')
    expect((await computeStats(300, 10)).studied).toBe(0)
  })
  it('упражнение не создаёт карточку у неизвестного слова, но меняет расписание у изучаемого', async () => {
    await recordAttempt({ type: 'tone', wordId: 'N', correct: true, assisted: false, answer: '1' })
    expect(await db.cards.get('N:hanzi2meaning')).toBeUndefined()
    await reviewCard('K', 'good', 'cards')
    const before = (await db.cards.get('K:hanzi2meaning'))!.card.reps
    await recordAttempt({ type: 'tone', wordId: 'K', correct: false, assisted: false, answer: '1' })
    expect((await db.cards.get('K:hanzi2meaning'))!.card.reps).toBe(before + 1)
  })
  it('экспорт → сброс → импорт возвращает прогресс', async () => {
    await reviewCard('A', 'good', 'cards')
    await db.writing.put({ char: '爱', stage: 'free', mistakes: 0, completedAt: 1 })
    const dump = await exportProgress()
    await resetAll()
    expect(await db.cards.count()).toBe(0)
    const r = await importProgress(dump)
    expect(r.ok).toBe(true)
    expect(await db.cards.count()).toBe(1)
    expect((await db.cards.get('A:hanzi2meaning'))!.card.due).toBeInstanceOf(Date)
    expect(await db.writing.count()).toBe(1)
  })
  it('повторный импорт не дублирует записи', async () => {
    await reviewCard('A', 'good', 'cards')
    const dump = await exportProgress()
    await importProgress(dump); await importProgress(dump)
    expect(await db.cards.count()).toBe(1)
    expect(await db.reviewLog.count()).toBe(1)
  })
  it('чужой файл отклоняется с понятным сообщением', async () => {
    expect((await importProgress('не json')).ok).toBe(false)
    expect((await importProgress('{"app":"other"}')).ok).toBe(false)
  })
})
