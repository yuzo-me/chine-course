// Нормализация и сравнение пиньиня. Без React, без обращений к браузеру.
const MARKS: Record<string, [string, number]> = {
  ā: ['a', 1], á: ['a', 2], ǎ: ['a', 3], à: ['a', 4], ē: ['e', 1], é: ['e', 2], ě: ['e', 3], è: ['e', 4],
  ī: ['i', 1], í: ['i', 2], ǐ: ['i', 3], ì: ['i', 4], ō: ['o', 1], ó: ['o', 2], ǒ: ['o', 3], ò: ['o', 4],
  ū: ['u', 1], ú: ['u', 2], ǔ: ['u', 3], ù: ['u', 4], ǖ: ['v', 1], ǘ: ['v', 2], ǚ: ['v', 3], ǜ: ['v', 4],
}
const TONE_CHARS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'], e: ['ē', 'é', 'ě', 'è'], i: ['ī', 'í', 'ǐ', 'ì'],
  o: ['ō', 'ó', 'ǒ', 'ò'], u: ['ū', 'ú', 'ǔ', 'ù'], v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
}

/** Ставит знак тона на нужную гласную слога (a/e → ou → последняя гласная). */
export function markSyllable(base: string, tone: number): string {
  const s = base.toLowerCase().replace(/u:|ü/g, 'v')
  const out = (str: string) => str.replace(/v/g, 'ü')
  if (tone < 1 || tone > 4) return out(s)
  let idx = s.search(/[ae]/)
  if (idx < 0) idx = s.indexOf('ou') >= 0 ? s.indexOf('ou') : -1
  if (idx < 0) {
    for (let i = s.length - 1; i >= 0; i--) if ('iouv'.includes(s[i])) { idx = i; break }
  }
  if (idx < 0) return out(s)
  const ch = s[idx]
  return out(s.slice(0, idx) + TONE_CHARS[ch][tone - 1] + s.slice(idx + 1))
}

/** «ni3 hao3» → «nǐ hǎo»; «lv4» / «lu:4» → «lǜ». Текст без цифр возвращается как есть (в нижнем регистре). */
export function normalizeInput(input: string): string {
  const s = input.trim().toLowerCase().replace(/ü/g, 'v').replace(/u:/g, 'v')
  if (!/[1-5]/.test(s)) return s.replace(/v/g, 'ü').replace(/\s+/g, ' ')
  return s
    .replace(/([a-z]+)([1-5])/g, (_m, base: string, t: string) => markSyllable(base, Number(t)) + ' ')
    .replace(/\s+/g, ' ').trim()
}

export interface PinyinParts { base: string; tones: number[] }

/** Раскладывает пиньинь (со знаками тонов или цифрами) на «буквы без тонов» и последовательность тонов (без нейтральных). */
export function parts(input: string): PinyinParts {
  const s = input.trim().toLowerCase().replace(/ü/g, 'v').replace(/u:/g, 'v')
  const tones: number[] = []
  let base = ''
  for (const ch of s) {
    if (MARKS[ch]) { base += MARKS[ch][0]; tones.push(MARKS[ch][1]) }
    else if (/[1-4]/.test(ch)) tones.push(Number(ch))
    else if (/[a-zv]/.test(ch)) base += ch
  }
  return { base, tones }
}

export interface PinyinCheck { ok: boolean; syllableOk: boolean; toneOk: boolean; matched?: string }

/** Сравнивает ответ ученика с эталоном. Эталон может содержать варианты через «/» (shéi/shuí). */
export function checkPinyin(answer: string, expected: string): PinyinCheck {
  const a = parts(answer)
  let best: PinyinCheck = { ok: false, syllableOk: false, toneOk: false }
  for (const variant of expected.split('/')) {
    const e = parts(variant)
    const syllableOk = a.base === e.base && a.base.length > 0
    const toneOk = a.tones.join() === e.tones.join()
    const cur: PinyinCheck = { ok: syllableOk && toneOk, syllableOk, toneOk, matched: variant }
    if (cur.ok) return cur
    if (cur.syllableOk && !best.syllableOk) best = cur
    else if (!best.syllableOk && !best.ok) best = { ...cur }
  }
  return best
}

export const TONE_NAMES: Record<number, string> = {
  1: '1-й тон — ровный высокий', 2: '2-й тон — восходящий', 3: '3-й тон — нисходяще-восходящий',
  4: '4-й тон — падающий', 5: 'нейтральный тон — короткий и лёгкий',
}

/** Тон слога (для упражнения «выбор тона»). 5 = нейтральный. */
export function toneOfSyllable(syl: string): number {
  const p = parts(syl)
  return p.tones[0] ?? 5
}

export function stripTones(py: string): string {
  return parts(py).base.replace(/v/g, 'ü')
}

const V = 'aeiouvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü'
const SYL = new RegExp(`(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[${V}]+(?:ng(?![${V}])|n(?![${V}]))?(?:r(?![${V}]))?`, 'g')

/** Слоги пиньиня слова (для первого варианта чтения). «bàba» → bà, ba; «nǚ’ér» → nǚ, ér. */
export function syllables(py: string): string[] {
  const first = py.split('/')[0].trim().toLowerCase()
  const out: string[] = []
  for (const chunk of first.split(/[\s’']+/).filter(Boolean)) out.push(...(chunk.match(SYL) ?? [chunk]))
  return out
}
