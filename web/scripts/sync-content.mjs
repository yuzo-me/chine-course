// Копирует данные курса из content/ в web/public (контент не хранится в коде).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const pub = path.resolve(here, '../public')
fs.mkdirSync(path.join(pub, 'data'), { recursive: true })
fs.mkdirSync(path.join(pub, 'audio'), { recursive: true })
fs.mkdirSync(path.join(pub, 'hanzi'), { recursive: true })
const dataFile = path.join(root, 'content/data/hsk1.json')
fs.copyFileSync(dataFile, path.join(pub, 'data/hsk1.json'))
for (const f of fs.readdirSync(path.join(root, 'content/audio'))) fs.copyFileSync(path.join(root, 'content/audio', f), path.join(pub, 'audio', f))
const d = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
const chars = new Set([...d.charactersWriting.map((c) => c.char)])
let missing = []
for (const ch of chars) {
  const src = path.resolve(here, '../node_modules/hanzi-writer-data', `${ch}.json`)
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(pub, 'hanzi', `${ch}.json`))
  else missing.push(ch)
}
console.log(`sync: ${d.words.length} слов, ${chars.size - missing.length}/${chars.size} знаков письма`, missing.length ? `нет данных: ${missing.join('')}` : '')
