import { describe, expect, it } from 'vitest'
import { checkPinyin, markSyllable, normalizeInput, toneOfSyllable } from './pinyin'

describe('normalizeInput', () => {
  it('ni3 → nǐ', () => expect(normalizeInput('ni3')).toBe('nǐ'))
  it('ni3 hao3 → nǐ hǎo', () => expect(normalizeInput('Ni3 Hao3')).toBe('nǐ hǎo'))
  it('v и u: → ü', () => {
    expect(normalizeInput('lv4')).toBe('lǜ')
    expect(normalizeInput('nu:3')).toBe('nǚ')
  })
  it('ou: тон на o', () => expect(markSyllable('dou', 1)).toBe('dōu'))
  it('iu/ui: тон на последнюю', () => {
    expect(markSyllable('liu', 2)).toBe('liú')
    expect(markSyllable('gui', 4)).toBe('guì')
  })
})

describe('checkPinyin', () => {
  it('ni3 = nǐ', () => expect(checkPinyin('ni3', 'nǐ').ok).toBe(true))
  it('регистр и пробелы', () => expect(checkPinyin(' Hànyǔ ', 'Hànyǔ').ok).toBe(true))
  it('слитно и раздельно', () => expect(checkPinyin('ni3hao3', 'nǐ hǎo').ok).toBe(true))
  it('апостроф не мешает', () => expect(checkPinyin('nv3er2', 'nǚ’ér').ok).toBe(true))
  it('верный слог, неверный тон', () => {
    const r = checkPinyin('ni2', 'nǐ')
    expect(r.syllableOk).toBe(true)
    expect(r.toneOk).toBe(false)
    expect(r.ok).toBe(false)
  })
  it('неверный слог', () => expect(checkPinyin('na3', 'nǐ').syllableOk).toBe(false))
  it('нейтральный тон: ba и ba5', () => {
    expect(checkPinyin('ba', 'ba').ok).toBe(true)
    expect(checkPinyin('ba5', 'ba').ok).toBe(true)
  })
  it('варианты через /', () => expect(checkPinyin('shui2', 'shéi/shuí').ok).toBe(true))
  it('пустой ответ не верен', () => expect(checkPinyin('', 'ba').ok).toBe(false))
  it('u и ü различаются', () => expect(checkPinyin('lu4', 'lǜ').syllableOk).toBe(false))
})

describe('toneOfSyllable', () => {
  it('тоны', () => {
    expect(toneOfSyllable('bā')).toBe(1)
    expect(toneOfSyllable('bà')).toBe(4)
    expect(toneOfSyllable('ba')).toBe(5)
  })
})

import { syllables } from './pinyin'
describe('syllables', () => {
  it('делит слитные слова', () => {
    expect(syllables('bàba')).toEqual(['bà', 'ba'])
    expect(syllables('Zhōngguó')).toEqual(['zhōng', 'guó'])
    expect(syllables('nǚ’ér')).toEqual(['nǚ', 'ér'])
    expect(syllables('xiānsheng')).toEqual(['xiān', 'sheng'])
    expect(syllables('hǎowánr')).toEqual(['hǎo', 'wánr'])
    expect(syllables('shéi/shuí')).toEqual(['shéi'])
    expect(syllables('dǎ diànhuà')).toEqual(['dǎ', 'diàn', 'huà'])
  })
})
