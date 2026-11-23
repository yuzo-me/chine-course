import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db } from '../../data/db'
import { recordAttempt } from '../../data/progress'
import type { Word } from '../../data/content'
import { gradeChoice, gradePinyin, makeExercise, pickWords, singleSyllableTone, type Exercise, type ExerciseType, type Verdict } from '../../domain/exercises'
import { normalizeInput } from '../../domain/pinyin'
import { AudioButton, Button, Card, Chinese, EmptyState, Icon, LinkButton, PageTitle, Pinyin, ProgressBar } from '../../ui/components'

const TYPES: { id: ExerciseType; title: string; text: string; zh: string }[] = [
  { id: 'hanzi2meaning', title: 'Иероглиф → значение', text: 'Выберите перевод слова', zh: '义' },
  { id: 'meaning2hanzi', title: 'Значение → иероглиф', text: 'Найдите слово по переводу', zh: '字' },
  { id: 'pinyinInput', title: 'Ввод пиньиня', text: 'Напишите чтение слова: можно ni3', zh: '拼' },
  { id: 'tone', title: 'Выбор тона', text: 'Какой тон у слога?', zh: '调' },
]

export function PracticeMenu() {
  return (
    <div className="page">
      <PageTitle title="Практика" zh="练习" />
      <div className="stack">
        {TYPES.map((t) => (
          <Link key={t.id} to={`/practice/${t.id}`} className="card word-row">
            <Chinese className="zh">{t.zh}</Chinese>
            <div><b>{t.title}</b><br /><span className="muted">{t.text}</span></div>
          </Link>
        ))}
        <Link to="/writing" className="card word-row">
          <Chinese className="zh">写</Chinese>
          <div><b>Письмо иероглифов</b><br /><span className="muted">Пишите по чертам, с подсказкой и без</span></div>
        </Link>
      </div>
    </div>
  )
}

const ROUND = 10
export function PracticeSession({ words }: { words: Word[] }) {
  const { type } = useParams<{ type: ExerciseType }>()
  const nav = useNavigate()
  const [items, setItems] = useState<Exercise[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)

  useEffect(() => {
    let alive = true
    void (async () => {
      const studied = new Set((await db.cards.toArray()).filter((c) => c.card.reps > 0).map((c) => c.wordId))
      const pool = studied.size >= ROUND ? words.filter((w) => studied.has(w.id)) : words
      const filtered = type === 'tone' ? pool.filter(singleSyllableTone) : pool
      const chosen = pickWords(filtered, ROUND, Math.random)
      if (alive) { setItems(chosen.map((w) => makeExercise(type as ExerciseType, w, words))); setIdx(0); setScore(0) }
    })()
    return () => { alive = false }
  }, [type, words, round])

  if (!type || !TYPES.some((t) => t.id === type)) return <EmptyState title="Такого упражнения нет" text="Вернитесь в практику и выберите упражнение." action={<LinkButton to="/practice">К практике</LinkButton>} />
  if (!items) return <div className="page" aria-busy="true"><p className="muted">Готовим задания…</p></div>

  if (idx >= items.length) {
    return (
      <div className="page">
        <EmptyState title="Раунд пройден!" text={`Правильных ответов: ${score} из ${items.length}.`}
          action={<div className="stack" style={{ width: '100%' }}>
            <Button block onClick={() => setRound((r) => r + 1)}>Ещё раунд</Button>
            <LinkButton block variant="secondary" to="/practice">Другое упражнение</LinkButton>
          </div>} />
      </div>
    )
  }
  const ex = items[idx]
  return (
    <div className="page">
      <div className="session-bar">
        <button type="button" className="icon-btn" aria-label="Выйти из упражнения" onClick={() => nav('/practice')}><Icon name="close" /></button>
        <div style={{ flex: 1 }}><ProgressBar value={idx} max={items.length} label="Прогресс раунда" /></div>
        <span className="muted">{idx + 1}/{items.length}</span>
      </div>
      <Question key={`${round}-${idx}`} ex={ex} words={words} onDone={(correct) => { if (correct) setScore((s) => s + 1); setIdx((i) => i + 1) }} />
    </div>
  )
}

function Question({ ex, words, onDone }: { ex: Exercise; words: Word[]; onDone: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [hint, setHint] = useState(false)
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const w = ex.word
  const isChoice = ex.type !== 'pinyinInput'
  const instruction = useMemo(() => ({
    hanzi2meaning: 'Что значит это слово?', meaning2hanzi: 'Выберите иероглифы для этого значения',
    pinyinInput: 'Напишите пиньинь (можно с цифрой тона: ni3)', tone: 'Какой тон у этого слога?',
  })[ex.type], [ex.type])

  const check = async () => {
    const v = isChoice ? gradeChoice(ex, picked ?? '', words) : gradePinyin(ex, text)
    setVerdict(v)
    await recordAttempt({ type: ex.type, wordId: w.id, correct: v.correct, assisted: hint, answer: isChoice ? picked ?? '' : text })
  }
  const canCheck = isChoice ? picked !== null : text.trim().length > 0

  return (
    <>
      <Card ornate className="stack" style={{ textAlign: 'center', alignItems: 'center' }}>
        <p className="muted">{instruction}</p>
        {ex.type === 'meaning2hanzi' ? <p style={{ fontSize: '1.75rem', fontWeight: 700 }}>{ex.prompt}</p> : (
          <div className="row"><Chinese>{ex.prompt}</Chinese>{ex.type === 'tone' && <AudioButton word={w} />}</div>
        )}
        {ex.type === 'tone' && <Pinyin className="">{ex.toneBase}</Pinyin>}
        {hint && ex.type !== 'tone' && (
          <p className="muted" role="status">Подсказка: <Pinyin>{w.pinyin}</Pinyin> — {w.meaningRuShort}. Ответ будет засчитан «с помощью».</p>
        )}
      </Card>

      {isChoice ? (
        <div className={ex.type === 'tone' ? 'grid2' : 'stack'} role="group" aria-label="Варианты ответа">
          {ex.options!.map((o) => {
            const done = verdict !== null
            const right = done && o.id === ex.correctId
            const wrong = done && o.id === picked && !right
            return (
              <button key={o.id} type="button" className={`opt ${o.lang === 'zh-CN' ? 'zh-opt' : ''} ${right ? 'right' : ''} ${wrong ? 'wrong' : ''}`}
                aria-pressed={picked === o.id} disabled={done} onClick={() => setPicked(o.id)} lang={o.lang === 'zh-CN' ? 'zh-CN' : undefined}>
                <span>{ex.type === 'tone' ? `${o.label}-й тон` : o.label}</span>
                {right && <span className="mark" aria-label="верно">✓ верно</span>}
                {wrong && <span className="mark" aria-label="неверно">✕ неверно</span>}
              </button>
            )
          })}
        </div>
      ) : (
        <div>
          <label htmlFor="py" className="label">Ваш ответ</label>
          <input id="py" className="field" lang="zh-Latn-pinyin" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
            value={text} disabled={verdict !== null} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canCheck && !verdict) void check() }} />
          {text && !verdict && <p className="muted" style={{ marginTop: 4 }}>Будет принято как: <Pinyin>{normalizeInput(text)}</Pinyin></p>}
        </div>
      )}

      {verdict && (
        <div className={`feedback ${verdict.correct ? 'ok' : 'bad'}`} role="status">
          <b>{verdict.correct ? '✓ ' : '✕ '}{verdict.title}</b>
          <p>{verdict.explanation}{hint && verdict.correct ? ' (с подсказкой)' : ''}</p>
        </div>
      )}

      <div className="row wrap">
        {!verdict && ex.type !== 'tone' && <Button variant="secondary" onClick={() => setHint(true)} disabled={hint}>Подсказка</Button>}
        <div style={{ flex: 1 }} />
        {!verdict ? <Button disabled={!canCheck} onClick={() => void check()}>Проверить</Button>
          : <Button onClick={() => onDone(verdict.correct)} autoFocus>Далее</Button>}
      </div>
    </>
  )
}
