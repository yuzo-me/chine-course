export interface Word {
  id: string; level: string; officialSerial: number; hanzi: string; pinyin: string; pos: string[]
  sourceNote: string; meaningsRu: string[]; meaningRuShort: string; audio: string; chars: string[]
  status: { meaning: string; audio: string; reviewedBy: string | null; reviewedAt: string | null }
  sourcePage: number
}
export interface CharItem { id: string; char: string; officialSerial: number; sourcePage: number; group?: string }
export interface Content { schemaVersion: number; words: Word[]; charactersRecognition: CharItem[]; charactersWriting: CharItem[] }

const base = import.meta.env.BASE_URL
let cache: Promise<Content> | null = null
export function loadContent(): Promise<Content> {
  cache ??= fetch(`${base}data/hsk1.json`).then((r) => {
    if (!r.ok) throw new Error('Не удалось загрузить слова')
    return r.json() as Promise<Content>
  })
  return cache
}
export const audioUrl = (w: Word) => `${base}${w.audio}`
export const hanziDataUrl = (ch: string) => `${base}hanzi/${encodeURIComponent(ch)}.json`

export const POS_RU: Record<string, string> = {
  名: 'сущ.', 动: 'глагол', 形: 'прил.', 副: 'нареч.', 代: 'местоим.', 数: 'числ.', 量: 'счётн. сл.',
  介: 'предлог', 连: 'союз', 助: 'частица', 叹: 'межд.', 前缀: 'префикс', 后缀: 'суффикс', 后: 'суффикс', 数量: 'числ.-счётн.',
}
