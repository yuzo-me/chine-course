import type { Word } from '../data/content'
import { checkPinyin, TONE_NAMES, stripTones, syllables, toneOfSyllable } from './pinyin'

export type ExerciseType = 'hanzi2meaning' | 'meaning2hanzi' | 'pinyinInput' | 'tone'
export type Rng = () => number

export interface ChoiceOption { id: string; label: string; lang?: 'zh-CN' | 'ru' }
export interface Exercise {
  type: ExerciseType
  word: Word
  prompt: string
  options?: ChoiceOption[]
  correctId?: string
  /** Для упражнения «выбор тона»: слог без тона. */
  toneBase?: string
}
export interface Verdict { correct: boolean; title: string; explanation: string }

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}
const pickN = <T,>(arr: T[], n: number, rng: Rng) => shuffle(arr, rng).slice(0, n)

function distractors(word: Word, all: Word[], rng: Rng, key: 'meaning' | 'hanzi'): Word[] {
  const others = all.filter((w) => w.id !== word.id && (key === 'meaning' ? w.meaningRuShort !== word.meaningRuShort : w.hanzi !== word.hanzi))
  const score = (w: Word) => {
    let s = 0
    if (w.pos[0] && w.pos[0] === word.pos[0]) s += 2
    if (key === 'hanzi') {
      if (w.hanzi.length === word.hanzi.length) s += 2
      if (w.chars.some((c) => word.chars.includes(c))) s += 3
    }
    return s + rng()
  }
  return others.sort((a, b) => score(b) - score(a)).slice(0, 8).sort(() => rng() - 0.5).slice(0, 3)
}

export function singleSyllableTone(w: Word): boolean {
  const s = syllables(w.pinyin)
  return s.length === 1 && !w.pinyin.includes('/') && toneOfSyllable(s[0]) !== 5
}

export function makeExercise(type: ExerciseType, word: Word, all: Word[], rng: Rng = Math.random): Exercise {
  switch (type) {
    case 'hanzi2meaning': {
      const opts = shuffle([word, ...distractors(word, all, rng, 'meaning')], rng)
      return { type, word, prompt: word.hanzi, correctId: word.id,
        options: opts.map((w) => ({ id: w.id, label: w.meaningRuShort, lang: 'ru' as const })) }
    }
    case 'meaning2hanzi': {
      const opts = shuffle([word, ...distractors(word, all, rng, 'hanzi')], rng)
      return { type, word, prompt: word.meaningRuShort, correctId: word.id,
        options: opts.map((w) => ({ id: w.id, label: w.hanzi, lang: 'zh-CN' as const })) }
    }
    case 'pinyinInput':
      return { type, word, prompt: word.hanzi }
    case 'tone': {
      const base = stripTones(syllables(word.pinyin)[0])
      const opts = [1, 2, 3, 4].map((t) => ({ id: String(t), label: `${t}` }))
      return { type, word, prompt: word.hanzi, toneBase: base, options: opts, correctId: String(toneOfSyllable(syllables(word.pinyin)[0])) }
    }
  }
}

export function gradeChoice(ex: Exercise, chosenId: string, all: Word[]): Verdict {
  const correct = chosenId === ex.correctId
  if (ex.type === 'tone') {
    const t = Number(ex.correctId)
    return correct
      ? { correct, title: 'Верно!', explanation: `${ex.word.hanzi} — ${ex.word.pinyin}. Это ${TONE_NAMES[t]}.` }
      : { correct, title: 'Не совсем', explanation: `Это ${TONE_NAMES[t]}: ${ex.word.pinyin}. Вы выбрали ${chosenId}-й тон.` }
  }
  if (correct) return { correct, title: 'Верно!', explanation: `${ex.word.hanzi} · ${ex.word.pinyin} — ${ex.word.meaningRuShort}.` }
  const chosen = all.find((w) => w.id === chosenId)
  if (ex.type === 'hanzi2meaning') {
    return { correct, title: 'Не совсем',
      explanation: `Вы выбрали «${chosen?.meaningRuShort}» — это значение слова ${chosen?.hanzi} (${chosen?.pinyin}). Правильно: «${ex.word.meaningRuShort}».` }
  }
  return { correct, title: 'Не совсем',
    explanation: `Вы выбрали ${chosen?.hanzi} (${chosen?.pinyin}) — «${chosen?.meaningRuShort}». Правильно: ${ex.word.hanzi} (${ex.word.pinyin}).` }
}

export function gradePinyin(ex: Exercise, answer: string): Verdict {
  const r = checkPinyin(answer, ex.word.pinyin)
  if (r.ok) return { correct: true, title: 'Верно!', explanation: `${ex.word.hanzi} — ${ex.word.pinyin}: «${ex.word.meaningRuShort}».` }
  if (r.syllableOk) {
    const tones = (r.matched ?? ex.word.pinyin).split('').filter(Boolean)
    void tones
    return { correct: false, title: 'Почти',
      explanation: `Слог верный, тон неверный. Правильно: ${r.matched ?? ex.word.pinyin}.` }
  }
  return { correct: false, title: 'Не совсем', explanation: `Правильно: ${ex.word.pinyin}.` }
}

export function pickWords(all: Word[], n: number, rng: Rng, filter?: (w: Word) => boolean): Word[] {
  return pickN(filter ? all.filter(filter) : all, n, rng)
}
