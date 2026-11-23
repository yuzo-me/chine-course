import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import HanziWriter from 'hanzi-writer'
import { db, type WritingRow } from '../../data/db'
import { useLive } from '../../data/hooks'
import { hanziDataUrl, type Content, type Word } from '../../data/content'
import { Button, Card, Chinese, EmptyState, LinkButton, PageTitle, Pinyin, ProgressBar } from '../../ui/components'

const RANK = { watched: 1, traced: 2, free: 3 } as const
const STAGE_LABEL = { watched: 'Смотрел', traced: 'С контуром', free: 'По памяти' } as const

export function WritingList({ content }: { content: Content }) {
  const rows = useLive(() => db.writing.toArray(), [], [] as WritingRow[])
  const byChar = new Map(rows.map((r) => [r.char, r]))
  const done = rows.filter((r) => r.stage === 'free').length
  return (
    <div className="page">
      <PageTitle title="Письмо" zh="写字" back="/practice" />
      <Card className="stack">
        <div className="row between"><span>Написано по памяти</span><span className="muted">{done} из {content.charactersWriting.length}</span></div>
        <ProgressBar value={done} max={content.charactersWriting.length} label="Иероглифов написано по памяти" />
        <p className="muted">Для каждого знака три шага: посмотреть анимацию → писать с контуром → писать по памяти.</p>
      </Card>
      <div className="grid-chars" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8 }}>
        {content.charactersWriting.map((c) => {
          const r = byChar.get(c.char)
          const cl = r?.stage === 'free' ? 'done' : r ? 'part' : ''
          return (
            <Link key={c.id} to={`/writing/${encodeURIComponent(c.char)}`} className={`char-cell ${cl}`} aria-label={`${c.char}${r ? `, ${STAGE_LABEL[r.stage]}` : ', не начат'}`}>
              <Chinese className="">{c.char}</Chinese>
              <small>{r ? (r.stage === 'free' ? '✓ готово' : STAGE_LABEL[r.stage]) : 'новый'}</small>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

type Mode = 'idle' | 'watch' | 'trace' | 'free'

export function WritingPage({ content }: { content: Content }) {
  const { char = '' } = useParams()
  const ch = decodeURIComponent(char)
  const list = content.charactersWriting.map((c) => c.char)
  const i = list.indexOf(ch)
  const box = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [msg, setMsg] = useState('Нажмите «Смотреть», чтобы увидеть порядок черт.')
  const [mistakes, setMistakes] = useState(0)
  const [loadErr, setLoadErr] = useState(false)
  const row = useLive(() => db.writing.get(ch), [ch], undefined)
  const sample: Word | undefined = content.words.find((w) => w.hanzi === ch) ?? content.words.find((w) => w.chars.includes(ch))

  const save = async (stage: keyof typeof RANK, m: number) => {
    const prev = await db.writing.get(ch)
    if (prev && RANK[prev.stage] > RANK[stage]) return
    await db.writing.put({ char: ch, stage, mistakes: (prev?.mistakes ?? 0) + m, completedAt: Date.now() })
  }

  useEffect(() => {
    const el = box.current
    if (!el || i < 0) return
    el.innerHTML = ''
    setMode('idle'); setMistakes(0); setLoadErr(false); setMsg('Нажмите «Смотреть», чтобы увидеть порядок черт.')
    const w = HanziWriter.create(el, ch, {
      width: 340, height: 340, padding: 14, showOutline: true, showCharacter: true,
      strokeColor: '#2a0d11', outlineColor: '#d6c39a', highlightColor: '#7a0f1f', drawingColor: '#7a0f1f', drawingWidth: 8,
      strokeAnimationSpeed: 1, delayBetweenStrokes: 250, leniency: 1.2,
      charDataLoader: (_c, onLoad, onError) => {
        fetch(hanziDataUrl(ch)).then((r) => { if (!r.ok) throw new Error('нет данных'); return r.json() }).then(onLoad).catch((e) => { setLoadErr(true); onError?.(e) })
      },
    })
    writer.current = w
    return () => { try { w.cancelQuiz() } catch { /* не было теста */ } el.innerHTML = ''; writer.current = null }
  }, [ch, i])

  if (i < 0) return <EmptyState title="Этого знака нет в списке письма" text="Список письма — 100 знаков группы 1–2." action={<LinkButton to="/writing">К списку</LinkButton>} />

  const watch = () => {
    const w = writer.current; if (!w) return
    w.cancelQuiz(); w.showOutline(); setMode('watch'); setMsg('Смотрите, как пишется знак: черта за чертой.')
    void w.animateCharacter({ onComplete: () => { setMode('idle'); setMsg('Теперь попробуйте сами: «С контуром».'); void save('watched', 0) } })
  }
  const quiz = (withOutline: boolean) => {
    const w = writer.current; if (!w) return
    w.cancelQuiz(); setMistakes(0); setMode(withOutline ? 'trace' : 'free')
    if (withOutline) { w.showOutline(); w.showCharacter() } else { w.hideOutline(); w.hideCharacter() }
    setMsg(withOutline ? 'Ведите пальцем или мышью по контуру, черта за чертой.' : 'Пишите по памяти. После 2 ошибок подряд появится подсказка.')
    let m = 0
    void w.quiz({
      showHintAfterMisses: withOutline ? 1 : 2, leniency: 1.2,
      onMistake: (s) => { m++; setMistakes(m); setMsg(`Не та черта. Попробуйте ещё: сейчас нужна черта №${s.strokeNum + 1}. Подсказка подсветится.`) },
      onCorrectStroke: (s) => setMsg(`Верно! Черта ${s.strokeNum + 1} из ${s.strokesRemaining + s.strokeNum + 1}.`),
      onComplete: (s) => { setMode('idle'); setMsg(`Готово! Ошибок: ${s.totalMistakes}. ${withOutline ? 'Теперь попробуйте по памяти.' : 'Знак записан.'}`); void save(withOutline ? 'traced' : 'free', s.totalMistakes) },
    })
  }
  const clear = () => { writer.current?.cancelQuiz(); writer.current?.showCharacter(); writer.current?.showOutline(); setMode('idle'); setMsg('Сброшено. Выберите шаг.') }

  return (
    <div className="page">
      <PageTitle title="Письмо" back="/writing" />
      <Card ornate className="stack" style={{ alignItems: 'center' }}>
        <div className="row" style={{ alignSelf: 'stretch', justifyContent: 'space-between' }}>
          <div>
            <Chinese className="zh-word">{ch}</Chinese>
            {sample && <div><Pinyin>{sample.pinyin}</Pinyin> <span className="muted">· {sample.hanzi}: {sample.meaningRuShort}</span></div>}
          </div>
          {row && <span className="badge success">✓ {STAGE_LABEL[row.stage]}</span>}
        </div>
        <div ref={box} className="writer-box" role="img" aria-label={`Холст для письма знака ${ch}`} />
        {loadErr && <p role="alert">Не удалось загрузить данные знака. Проверьте, что сайт открыт целиком, и обновите страницу.</p>}
        <p role="status" aria-live="polite" style={{ minHeight: '3em', textAlign: 'center' }}>{msg}</p>
        {mode !== 'idle' && mode !== 'watch' && <p className="muted">Ошибок: {mistakes}</p>}
      </Card>
      <div className="grid3">
        <Button variant={mode === 'watch' ? 'primary' : 'secondary'} onClick={watch}>1 Смотреть</Button>
        <Button variant={mode === 'trace' ? 'primary' : 'secondary'} onClick={() => quiz(true)}>2 С контуром</Button>
        <Button variant={mode === 'free' ? 'primary' : 'secondary'} onClick={() => quiz(false)}>3 По памяти</Button>
      </div>
      <Button variant="ghost" onClick={clear}>Сбросить холст</Button>
      <div className="row between">
        {i > 0 ? <LinkButton variant="secondary" to={`/writing/${encodeURIComponent(list[i - 1])}`}>← {list[i - 1]}</LinkButton> : <span />}
        {i < list.length - 1 && <LinkButton variant="secondary" to={`/writing/${encodeURIComponent(list[i + 1])}`}>{list[i + 1]} →</LinkButton>}
      </div>
    </div>
  )
}
