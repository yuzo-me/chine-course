import type { Word } from '../data/content'
import { parts } from './pinyin'

const HAN = /[一-鿿]/
const CYR = /[а-яё]/i

export interface SearchIndexItem { w: Word; base: string; tones: string; meaning: string }
export function buildIndex(words: Word[]): SearchIndexItem[] {
  return words.map((w) => {
    const p = parts(w.pinyin.split('/')[0])
    const all = w.pinyin.split('/').map((v) => parts(v).base)
    return { w, base: all.join('|'), tones: p.tones.join(''), meaning: w.meaningsRu.join('; ').toLowerCase() }
  })
}

/** Поиск по иероглифу, пиньиню (со знаками, цифрами или без тонов) и по-русски. */
export function search(index: SearchIndexItem[], query: string, limit = 40): Word[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const scored: { w: Word; s: number }[] = []
  if (HAN.test(q)) {
    for (const it of index) {
      if (it.w.hanzi === q) scored.push({ w: it.w, s: 100 })
      else if (it.w.hanzi.includes(q)) scored.push({ w: it.w, s: 50 - it.w.hanzi.length })
      else if ([...q].some((c) => it.w.hanzi.includes(c))) scored.push({ w: it.w, s: 5 })
    }
  } else if (CYR.test(q)) {
    for (const it of index) {
      const idx = it.meaning.indexOf(q)
      if (idx < 0) continue
      const exact = it.w.meaningsRu.some((m) => m.toLowerCase() === q)
      scored.push({ w: it.w, s: exact ? 100 : idx === 0 ? 60 : 30 })
    }
  } else {
    const p = parts(q)
    if (!p.base) return []
    const hasTone = p.tones.length > 0
    for (const it of index) {
      const bases = it.base.split('|')
      const exact = bases.includes(p.base)
      const starts = bases.some((b) => b.startsWith(p.base))
      if (!exact && !starts) continue
      if (hasTone && exact && it.tones !== p.tones.join('')) continue
      if (hasTone && !exact && !it.tones.startsWith(p.tones.join(''))) continue
      scored.push({ w: it.w, s: (exact ? 100 : 40) - it.w.hanzi.length })
    }
  }
  return scored.sort((a, b) => b.s - a.s || a.w.officialSerial - b.w.officialSerial).slice(0, limit).map((x) => x.w)
}
