import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'
import { loadContent, type Content } from './content'

/** Подписка на данные IndexedDB: перерисовывается при любых изменениях. */
export function useLive<T>(query: () => Promise<T>, deps: unknown[], initial: T): T {
  const [val, setVal] = useState<T>(initial)
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setVal, error: () => undefined })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return val
}

export function useContent(): { content: Content | null; error: boolean; retry: () => void } {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState(false)
  const [n, setN] = useState(0)
  useEffect(() => {
    let alive = true
    setError(false)
    loadContent().then((c) => alive && setContent(c)).catch(() => alive && setError(true))
    return () => { alive = false }
  }, [n])
  return { content, error, retry: () => setN((x) => x + 1) }
}

export function useLocalSetting<T>(key: string, fallback: T): [T, (v: T) => void] {
  const read = (): T => { try { const s = localStorage.getItem(key); return s === null ? fallback : (JSON.parse(s) as T) } catch { return fallback } }
  const [v, setV] = useState<T>(read)
  useEffect(() => {
    const on = (e: Event) => { if ((e as CustomEvent).detail === key) setV(read()) }
    window.addEventListener('local-setting', on)
    return () => window.removeEventListener('local-setting', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const set = (nv: T) => {
    try { localStorage.setItem(key, JSON.stringify(nv)) } catch { /* приватный режим */ }
    setV(nv)
    window.dispatchEvent(new CustomEvent('local-setting', { detail: key }))
  }
  return [v, set]
}
