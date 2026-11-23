import { Link } from 'react-router-dom'
import { Chinese, Card, LinkButton, ProgressBar } from '../../ui/components'
import { computeStats, type Stats } from '../../data/progress'
import { useLive, useLocalSetting } from '../../data/hooks'
import { Frieze, Seal } from '../../ui/Scenery'

const empty: Stats = { studied: 0, learned: 0, dueToday: 0, newToday: 0, writtenChars: 0, attempts: 0, correct: 0, reviewsToday: 0 }

export function Home({ total }: { total: number }) {
  const [perDay] = useLocalSetting('newPerDay', 10)
  const s = useLive(() => computeStats(total, perDay), [total, perDay], empty)
  const todo = s.dueToday + s.newToday
  const fresh = s.studied === 0
  return (
    <div className="page">
      <section className="hero">
        <div className="row" style={{ justifyContent: 'center' }}><Seal /></div>
        <p className="title-zh" lang="zh-CN">汉语</p>
        <h1 style={{ marginTop: 6 }}>Китайский · HSK 1</h1>
        <p className="muted" style={{ marginTop: 4 }}>300 слов и 100 иероглифов программы HSK 3.0</p>
        <Frieze />
      </section>

      <Card className="stack">
        {fresh ? (
          <>
            <h2>Начнём с первых слов</h2>
            <p>Карточки покажут слово, а вы вспомните его значение. Каждый день — по несколько слов.</p>
            <LinkButton to="/cards" block>Начать учить</LinkButton>
          </>
        ) : todo > 0 ? (
          <>
            <h2>Продолжить</h2>
            <p>Сегодня: повторить <b>{s.dueToday}</b>, новых слов <b>{s.newToday}</b>.</p>
            <LinkButton to="/cards" block>Продолжить</LinkButton>
          </>
        ) : (
          <>
            <h2>На сегодня всё!</h2>
            <p>Вы повторили всё, что было нужно. Можно потренироваться в упражнениях.</p>
            <LinkButton to="/practice" block variant="secondary">Перейти к практике</LinkButton>
          </>
        )}
      </Card>

      <div className="grid3">
        <Card className="stat"><b>{s.dueToday}</b><span className="muted">Повторов на сегодня</span></Card>
        <Card className="stat"><b>{s.studied}</b><span className="muted">Изучено слов</span></Card>
        <Card className="stat"><b>{s.learned}</b><span className="muted">Закреплено</span></Card>
      </div>
      <Card className="stack">
        <div className="row between"><span>Слов изучено</span><span className="muted">{s.studied} из {total}</span></div>
        <ProgressBar value={s.studied} max={total} label="Слов изучено" />
      </Card>

      <h2>Разделы</h2>
      <div className="grid2">
        <Link to="/cards" className="card tile"><span className="zh" lang="zh-CN">卡</span><b>Карточки</b><span className="muted">Слова и повторение</span></Link>
        <Link to="/practice" className="card tile"><span className="zh" lang="zh-CN">练</span><b>Практика</b><span className="muted">Упражнения с проверкой</span></Link>
        <Link to="/dictionary" className="card tile"><span className="zh" lang="zh-CN">典</span><b>Словарь</b><span className="muted">Поиск слов</span></Link>
        <Link to="/writing" className="card tile"><span className="zh" lang="zh-CN">写</span><b>Письмо</b><span className="muted">100 иероглифов по чертам</span></Link>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}><Chinese className="">学而时习之</Chinese> — «Учиться и постоянно повторять»</p>
    </div>
  )
}
