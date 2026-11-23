import Dexie, { type Table } from 'dexie'
import type { Card } from 'ts-fsrs'

export type Direction = 'hanzi2meaning' | 'meaning2hanzi'
export interface CardRow { id: string; wordId: string; direction: Direction; due: number; card: Card; createdAt: number }
export interface ReviewLogRow { id: string; cardId: string; rating: 1 | 2 | 3 | 4; reviewedAt: number; source: 'cards' | 'exercise'; assisted: boolean }
export interface AttemptRow { id: string; type: string; wordId: string; correct: boolean; assisted: boolean; answer: string; at: number }
export interface WritingRow { char: string; stage: 'watched' | 'traced' | 'free'; mistakes: number; completedAt: number }
export interface SettingRow { key: string; value: unknown }

class AppDB extends Dexie {
  cards!: Table<CardRow, string>
  reviewLog!: Table<ReviewLogRow, string>
  exerciseAttempts!: Table<AttemptRow, string>
  writing!: Table<WritingRow, string>
  settings!: Table<SettingRow, string>
  constructor(name = 'hsk-trainer') {
    super(name)
    this.version(1).stores({
      cards: 'id, wordId, due',
      reviewLog: 'id, cardId, reviewedAt',
      exerciseAttempts: 'id, wordId, at',
      writing: 'char',
      settings: 'key',
    })
  }
}
export const db = new AppDB()

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key)
  return row ? (row.value as T) : fallback
}
export const setSetting = (key: string, value: unknown) => db.settings.put({ key, value })
export const uid = () => crypto.randomUUID()
