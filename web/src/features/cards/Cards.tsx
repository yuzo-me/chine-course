import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../../data/db'
import { reviewCard } from '../../data/progress'
import { dayStart, buildQueue, requeueAfterAgain, CHOICE_LABEL, type Choice, type QueueCard } from '../../domain/scheduling'
import type { Word } from '../../data/content'
import { AudioButton, Button, Card, Chinese, EmptyState, Icon, LinkButton, Pinyin, ProgressBar, playWord } from '../../ui/components'
import { POS_RU } from '../../data/content'
import { useLocalSetting } from '../../data/hooks'

const SESSION_SIZE = 20
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const FLIP_MS = reduceMotion() ? 0 : 320 // совпадает с --dur-flip в стилях

export function Cards({ words }: { words: Word[] }) {
  const nav = useNavigate()
  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  const [perDay] = useLocalSetting('newPerDay', 10)
  const [queue, setQueue] = useState<QueueCard[] | null>(null)
  const [total, setTotal] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const [again, setAgain] = useState(0)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const rows = await db.cards.toArray()
    const introduced = rows.filter((r) => r.createdAt >= dayStart(Date.now())).length
    const q = buildQueue(rows, words.map((w) => w.id), Date.now(), perDay - introduced).slice(0, SESSION_SIZE)
    setQueue(q); setTotal(q.length); setDone(0); setAgain(0); setFlipped(false)
  }, [words, perDay])
  useEffect(() => { void load() }, [load])

  const current = queue?.[0]
  const word = current ? byId.get(current.wordId) : undefined

  const rate = useCallback(async (choice: Choice) => {
    if (!current || !queue || busy) return
    setBusy(true)
    await reviewCard(current.wordId, choice, 'cards')
    setFlipped(false) // карточка переворачивается обратно, и только потом появляется следующая
    await new Promise((r) => setTimeout(r, FLIP_MS))
    let next = queue.slice(1)
    if (choice === 'again') { next = requeueAfterAgain(next, current); setAgain((a) => a + 1) } else setDone((d) => d + 1)
    setQueue(next); setBusy(false)
  }, [current, queue, busy])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || (e.target as HTMLElement).tagName === 'INPUT') return
      if (!flipped && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); setFlipped(true) }
      else if (flipped && '1234'.includes(e.key) && e.key) void rate((['again', 'hard', 'good', 'easy'] as Choice[])[Number(e.key) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, flipped, rate])

  useEffect(() => { if (flipped) document.getElementById('rate-good')?.focus() }, [flipped])

  if (!queue) return <div className="page" aria-busy="true"><p className="muted">Загрузка…</p></div>

  if (!word) {
    return (
      <div className="page">
        <div className="session-bar"><Link to="/" className="icon-btn" aria-label="Закрыть"><Icon name="close" /></Link></div>
        <EmptyState title={total ? 'Занятие закончено!' : 'На сегодня карточек нет'}
          text={total ? `Вы прошли ${done} карточек${again ? `, «Не помню» нажато ${again} раз` : ''}. Завтра слова вернутся по расписанию.` : 'Все повторы сделаны, а новые слова на сегодня закончились. Загляните в практику.'}
          action={<div className="stack" style={{ width: '100%' }}>
            {total > 0 && <Button block onClick={() => void load()}>Ещё карточки</Button>}
            <LinkButton block variant="secondary" to="/practice">К практике</LinkButton>
            <LinkButton block variant="ghost" to="/">На главную</LinkButton>
          </div>} />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="session-bar">
        <button type="button" className="icon-btn" aria-label="Закрыть занятие" onClick={() => nav('/')}><Icon name="close" /></button>
        <div style={{ flex: 1 }}><ProgressBar value={done} max={total} label="Прогресс занятия" /></div>
        <span className="muted">{done}/{total}</span>
      </div>

      <div className={`flip ${flipped ? 'is-flipped' : ''}`} data-testid="flip-card">
        <div className="flip-inner">
          <Card ornate className="flip-face flash" inert={flipped} aria-hidden={flipped}>
            {current?.isNew && <span className="badge neutral">Новое слово</span>}
            <div className="row" style={{ alignItems: 'center' }}>
              <Chinese>{word.hanzi}</Chinese>
              <AudioButton word={word} />
            </div>
            <Button block disabled={busy} onClick={() => setFlipped(true)} style={{ marginTop: 'auto' }}>Перевернуть</Button>
          </Card>
          <Card ornate className="flip-face flip-back flash" inert={!flipped} aria-hidden={!flipped} aria-live="polite">
            <div className="row" style={{ alignItems: 'center' }}>
              <Chinese className="zh-char-sm">{word.hanzi}</Chinese>
              <AudioButton word={word} />
            </div>
            <Pinyin>{word.pinyin}</Pinyin>
            <p style={{ fontSize: '1.375rem', fontWeight: 700 }}>{word.meaningsRu.join('; ')}</p>
            <p className="muted">{word.pos.map((p) => POS_RU[p] ?? p).join(', ')}</p>
            <Link to={`/dictionary/${word.id}`} className="muted">Открыть в словаре</Link>
          </Card>
        </div>
      </div>

      {flipped || busy ? (
        <div className="rating" role="group" aria-label="Как хорошо вы помните слово?">
          <Button className="rate-again" disabled={busy} onClick={() => void rate('again')}>{CHOICE_LABEL.again}<small>1</small></Button>
          <Button className="rate-hard" disabled={busy} onClick={() => void rate('hard')}>{CHOICE_LABEL.hard}<small>2</small></Button>
          <Button id="rate-good" className="rate-good" disabled={busy} onClick={() => void rate('good')}>{CHOICE_LABEL.good}<small>3</small></Button>
          <Button className="rate-easy" disabled={busy} onClick={() => void rate('easy')}>{CHOICE_LABEL.easy}<small>4</small></Button>
        </div>
      ) : (
        <p className="muted" style={{ textAlign: 'center' }}>Вспомните значение, затем нажмите «Перевернуть» (пробел)</p>
      )}
      <button type="button" className="sr-only" onClick={() => playWord(word)}>Озвучить слово</button>
    </div>
  )
}
