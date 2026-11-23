import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../../data/db'
import { addToStudy } from '../../data/progress'
import { useLive } from '../../data/hooks'
import { POS_RU, type Content, type Word } from '../../data/content'
import { buildIndex, search } from '../../domain/search'
import { isLearned } from '../../domain/scheduling'
import { AudioButton, Badge, Button, Card, Chinese, EmptyState, LinkButton, PageTitle, Pinyin } from '../../ui/components'

export function Dictionary({ words }: { words: Word[] }) {
  const index = useMemo(() => buildIndex(words), [words])
  const [q, setQ] = useState('')
  const results = useMemo(() => search(index, q), [index, q])
  return (
    <div className="page">
      <PageTitle title="Словарь" zh="词典" />
      <div>
        <label htmlFor="q" className="label">Поиск слова</label>
        <input id="q" className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" autoCapitalize="none"
          placeholder="иероглиф, pinyin (ni3) или по-русски" />
        <p className="muted" style={{ marginTop: 4 }}>Всего слов в словаре: {words.length}. Работает без интернета.</p>
      </div>
      {q.trim() && results.length === 0 && (
        <EmptyState title="Ничего не нашлось" text="Проверьте написание. Пиньинь можно вводить с цифрой тона (ni3) или без тона. Слова вне HSK 1 здесь не ищутся." />
      )}
      <div className="stack" aria-live="polite">
        {results.map((w) => (
          <Link key={w.id} to={`/dictionary/${w.id}`} className="card word-row">
            <Chinese className="zh">{w.hanzi}</Chinese>
            <div style={{ flex: 1 }}><Pinyin>{w.pinyin}</Pinyin><br /><span>{w.meaningRuShort}</span></div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function WordPage({ content }: { content: Content }) {
  const { id } = useParams()
  const word = content.words.find((w) => w.id === id)
  const row = useLive(() => (id ? db.cards.get(`${id}:hanzi2meaning`) : Promise.resolve(undefined)), [id], undefined)
  if (!word) return <EmptyState title="Слово не найдено" text="Возможно, ссылка устарела." action={<LinkButton to="/dictionary">В словарь</LinkButton>} />
  const writable = new Set(content.charactersWriting.map((c) => c.char))
  const status = !row ? <Badge>Новое слово</Badge> : isLearned(row.card) ? <Badge kind="success">Закреплено</Badge> : row.card.reps > 0 ? <Badge kind="attention">Изучается</Badge> : <Badge>В очереди</Badge>
  return (
    <div className="page">
      <PageTitle title="Слово" back="/dictionary" />
      <Card ornate className="stack" style={{ textAlign: 'center', alignItems: 'center' }}>
        <div className="row"><Chinese className="zh-word">{word.hanzi}</Chinese><AudioButton word={word} /></div>
        <Pinyin>{word.pinyin}</Pinyin>
        <h2>{word.meaningsRu.join('; ')}</h2>
        <p className="muted">{word.pos.map((p) => POS_RU[p] ?? p).join(', ') || 'фраза'}</p>
        {status}
      </Card>
      <Card className="stack">
        <h2>Иероглифы слова</h2>
        <div className="row wrap">
          {word.chars.map((c, i) => writable.has(c)
            ? <Link key={i} to={`/writing/${encodeURIComponent(c)}`} className="char-cell" style={{ width: 72 }} aria-label={`Писать иероглиф ${c}`}><Chinese className="">{c}</Chinese><small>писать</small></Link>
            : <span key={i} className="char-cell" style={{ width: 72 }}><Chinese className="">{c}</Chinese><small>читать</small></span>)}
        </div>
      </Card>
      {word.sourceNote && <p className="muted">Пометка программы HSK: {word.sourceNote.replace('|омоним:', ' омоним ')}</p>}
      {!row && <Button block onClick={() => void addToStudy(word.id)}>Добавить в изучение</Button>}
      {row && <p className="muted" style={{ textAlign: 'center' }}>Слово уже в вашем расписании повторений.</p>}
    </div>
  )
}
