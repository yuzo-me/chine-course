import { useRef, useState } from 'react'
import { computeStats, exportProgress, importProgress, resetAll, type Stats } from '../../data/progress'
import { fillDemo } from '../../data/demo'
import { useLive, useLocalSetting } from '../../data/hooks'
import type { Content } from '../../data/content'
import { Button, Card, PageTitle, ProgressBar } from '../../ui/components'

const empty: Stats = { studied: 0, learned: 0, dueToday: 0, newToday: 0, writtenChars: 0, attempts: 0, correct: 0, reviewsToday: 0 }

export function Progress({ content }: { content: Content }) {
  const [perDay, setPerDay] = useLocalSetting('newPerDay', 10)
  const [dragon, setDragon] = useLocalSetting('dragon', true)
  const s = useLive(() => computeStats(content.words.length, perDay), [content, perDay], empty)
  const [note, setNote] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const acc = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0

  const doExport = async () => {
    const blob = new Blob([await exportProgress()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `hsk-progress-${new Date().toISOString().slice(0, 10)}.json`; a.click()
    URL.revokeObjectURL(a.href); setNote('Файл с прогрессом сохранён.')
  }
  const doImport = async (f: File | undefined) => { if (f) setNote((await importProgress(await f.text())).message) }

  return (
    <div className="page">
      <PageTitle title="Прогресс" zh="进度" />
      <div className="grid2">
        <Card className="stat"><b>{s.studied}</b><span className="muted">Изучено слов из {content.words.length}</span></Card>
        <Card className="stat"><b>{s.learned}</b><span className="muted">Закреплено (интервал ≥ 14 дн.)</span></Card>
        <Card className="stat"><b>{s.dueToday}</b><span className="muted">Повторов на сегодня</span></Card>
        <Card className="stat"><b>{s.writtenChars}</b><span className="muted">Знаков написано по памяти из {content.charactersWriting.length}</span></Card>
      </div>
      <Card className="stack">
        <div className="row between"><span>Слов изучено</span><span className="muted">{s.studied} / {content.words.length}</span></div>
        <ProgressBar value={s.studied} max={content.words.length} label="Слов изучено" />
        <div className="row between"><span>Иероглифов написано</span><span className="muted">{s.writtenChars} / {content.charactersWriting.length}</span></div>
        <ProgressBar value={s.writtenChars} max={content.charactersWriting.length} label="Иероглифов написано" />
        <p className="muted">Ответов в упражнениях: {s.attempts}, верных: {s.correct}{s.attempts ? ` (${acc}%)` : ''}. Повторений сегодня: {s.reviewsToday}.</p>
      </Card>

      <h2>Настройки</h2>
      <Card className="stack">
        <label className="row between" style={{ minHeight: 48 }}>
          <span><b>Дракон на фоне</b><br /><span className="muted">Красиво, но можно выключить, если телефон греется</span></span>
          <input type="checkbox" checked={dragon} onChange={(e) => setDragon(e.target.checked)} style={{ width: 28, height: 28 }} />
        </label>
        <div>
          <label htmlFor="perday" className="label">Новых слов в день</label>
          <select id="perday" className="field" value={perDay} onChange={(e) => setPerDay(Number(e.target.value))}>
            {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </Card>

      <h2>Резервная копия</h2>
      <Card className="stack">
        <p className="muted">Прогресс хранится только в этом браузере. Сохраните файл, чтобы перенести его на другое устройство.</p>
        <Button block onClick={() => void doExport()}>Сохранить прогресс в файл</Button>
        <Button block variant="secondary" onClick={() => file.current?.click()}>Загрузить прогресс из файла</Button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { void doImport(e.target.files?.[0]); e.target.value = '' }} />
        {note && <p role="status"><b>{note}</b></p>}
      </Card>

      <h2>Для показа</h2>
      <Card className="stack">
        <Button block variant="secondary" onClick={() => void fillDemo(content).then(() => setNote('Демо-данные добавлены.'))}>Заполнить демо-данными</Button>
        <Button block variant="ghost" onClick={() => { if (window.confirm('Удалить весь прогресс на этом устройстве? Это нельзя отменить.')) void resetAll().then(() => setNote('Прогресс сброшен.')) }}>Сбросить весь прогресс</Button>
      </Card>
    </div>
  )
}
