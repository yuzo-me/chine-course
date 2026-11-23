import { describe, expect, it } from 'vitest'
import type { Word } from '../data/content'
import { gradeChoice, gradePinyin, makeExercise, singleSyllableTone } from './exercises'

const mk = (i: number, hanzi: string, pinyin: string, m: string, pos = '名'): Word => ({
  id: `W${i}`, level: '1', officialSerial: i, hanzi, pinyin, pos: [pos], sourceNote: '', meaningsRu: [m], meaningRuShort: m,
  audio: '', chars: [...hanzi], status: { meaning: '', audio: '', reviewedBy: null, reviewedAt: null }, sourcePage: 1,
})
const words = [mk(1, '你', 'nǐ', 'ты'), mk(2, '我', 'wǒ', 'я'), mk(3, '他', 'tā', 'он'), mk(4, '爸爸', 'bàba', 'папа'), mk(5, '好', 'hǎo', 'хороший'), mk(6, '大', 'dà', 'большой')]
const rng = () => 0.42

describe('exercises', () => {
  it('иероглиф → значение: 4 уникальных варианта, один верный', () => {
    const ex = makeExercise('hanzi2meaning', words[0], words, rng)
    expect(ex.options).toHaveLength(4)
    expect(new Set(ex.options!.map((o) => o.id)).size).toBe(4)
    expect(ex.options!.filter((o) => o.id === ex.correctId)).toHaveLength(1)
  })
  it('значение → иероглиф', () => {
    const ex = makeExercise('meaning2hanzi', words[1], words, rng)
    expect(ex.prompt).toBe('я')
    expect(ex.options!.find((o) => o.id === ex.correctId)!.label).toBe('我')
  })
  it('разбор ошибки называет выбранное слово и правильный ответ', () => {
    const ex = makeExercise('hanzi2meaning', words[0], words, rng)
    const wrong = ex.options!.find((o) => o.id !== ex.correctId)!
    const v = gradeChoice(ex, wrong.id, words)
    expect(v.correct).toBe(false)
    expect(v.explanation).toContain('ты')
  })
  it('ввод пиньиня: ni3 верно, ni2 — тон', () => {
    const ex = makeExercise('pinyinInput', words[0], words, rng)
    expect(gradePinyin(ex, 'ni3').correct).toBe(true)
    const v = gradePinyin(ex, 'ni2')
    expect(v.correct).toBe(false)
    expect(v.explanation).toContain('Слог верный, тон неверный')
  })
  it('выбор тона', () => {
    expect(singleSyllableTone(words[0])).toBe(true)
    expect(singleSyllableTone(words[3])).toBe(false)
    const ex = makeExercise('tone', words[0], words, rng)
    expect(ex.toneBase).toBe('ni')
    expect(ex.correctId).toBe('3')
    expect(gradeChoice(ex, '4', words).explanation).toContain('3-й тон')
  })
})
