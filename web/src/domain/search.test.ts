import { describe, expect, it } from 'vitest'
import type { Word } from '../data/content'
import { buildIndex, search } from './search'

const mk = (i: number, hanzi: string, pinyin: string, m: string): Word => ({
  id: `W${i}`, level: '1', officialSerial: i, hanzi, pinyin, pos: ['名'], sourceNote: '', meaningsRu: [m], meaningRuShort: m,
  audio: '', chars: [...hanzi], status: { meaning: '', audio: '', reviewedBy: null, reviewedAt: null }, sourcePage: 1,
})
const idx = buildIndex([mk(1, '你', 'nǐ', 'ты'), mk(2, '你好', 'nǐ hǎo', 'здравствуйте'), mk(3, '好', 'hǎo', 'хороший'), mk(4, '女儿', 'nǚ’ér', 'дочь')])

describe('search', () => {
  it('по иероглифу', () => expect(search(idx, '你')[0].hanzi).toBe('你'))
  it('по пиньиню без тона', () => expect(search(idx, 'hao').map((w) => w.hanzi)).toContain('好'))
  it('по пиньиню с цифрой', () => expect(search(idx, 'ni3')[0].hanzi).toBe('你'))
  it('по пиньиню со знаком', () => expect(search(idx, 'nǐ hǎo')[0].hanzi).toBe('你好'))
  it('по-русски', () => expect(search(idx, 'дочь')[0].hanzi).toBe('女儿'))
  it('по части русского слова', () => expect(search(idx, 'здрав')[0].hanzi).toBe('你好'))
  it('тон отсеивает чужие', () => expect(search(idx, 'hao4')).toHaveLength(0))
  it('пустой запрос', () => expect(search(idx, '  ')).toEqual([]))
})
