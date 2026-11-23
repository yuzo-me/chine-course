import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useContent, useLocalSetting } from '../data/hooks'
import { Dragon } from '../ui/Dragon'
import { Lantern, Scenery } from '../ui/Scenery'
import { Card, ErrorState, Icon, LinkButton } from '../ui/components'
import { Home } from '../features/home/Home'
import { Cards } from '../features/cards/Cards'
import { PracticeMenu, PracticeSession } from '../features/practice/Practice'
import { Dictionary, WordPage } from '../features/dictionary/Dictionary'
import { WritingList, WritingPage } from '../features/writing/Writing'
import { Progress } from '../features/progress/Progress'

const NAV = [
  { to: '/', label: 'Главная', icon: 'home', end: true },
  { to: '/cards', label: 'Карточки', icon: 'cards' },
  { to: '/practice', label: 'Практика', icon: 'practice' },
  { to: '/dictionary', label: 'Словарь', icon: 'dict' },
  { to: '/progress', label: 'Прогресс', icon: 'progress' },
]

/** Внутри занятия нижняя навигация скрыта: выход — крестиком. */
const inSession = (p: string) => p === '/cards' || /^\/practice\/.+/.test(p) || /^\/writing\/.+/.test(p)

export function App() {
  const { pathname } = useLocation()
  const { content, error, retry } = useContent()
  const [dragon] = useLocalSetting('dragon', true)
  const home = pathname === '/'
  const hideNav = inSession(pathname)

  return (
    <>
      <Scenery variant={home ? 'hero' : 'ambient'} />
      {dragon && <Dragon variant={home ? 'hero' : 'ambient'} />}
      <Lantern size={0.9} style={{ left: 24 }} />
      <Lantern size={0.9} style={{ right: 24 }} />
      <main className={`shell ${hideNav ? 'no-nav' : ''}`}>
        {error ? <ErrorState text="Не удалось загрузить слова. Проверьте интернет при первом открытии." onRetry={retry} />
          : !content ? <Card aria-busy="true"><p>Загрузка слов…</p></Card>
          : (
            <Routes>
              <Route path="/" element={<Home total={content.words.length} />} />
              <Route path="/cards" element={<Cards words={content.words} />} />
              <Route path="/practice" element={<PracticeMenu />} />
              <Route path="/practice/:type" element={<PracticeSession words={content.words} />} />
              <Route path="/dictionary" element={<Dictionary words={content.words} />} />
              <Route path="/dictionary/:id" element={<WordPage content={content} />} />
              <Route path="/writing" element={<WritingList content={content} />} />
              <Route path="/writing/:char" element={<WritingPage content={content} />} />
              <Route path="/progress" element={<Progress content={content} />} />
              <Route path="*" element={<Card className="stack"><h2>Такой страницы нет</h2><LinkButton to="/">На главную</LinkButton></Card>} />
            </Routes>
          )}
      </main>
      {!hideNav && (
        <nav className="bottom-nav" aria-label="Основные разделы">
          <ul>
            {NAV.map((n) => (
              <li key={n.to}><NavLink to={n.to} end={n.end}><Icon name={n.icon} /><span>{n.label}</span></NavLink></li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}
