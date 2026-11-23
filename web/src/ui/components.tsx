import { Link, type LinkProps } from 'react-router-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { audioUrl, type Word } from '../data/content'

type Variant = 'primary' | 'secondary' | 'ghost'
const cls = (v: Variant, block?: boolean, extra = '') => `btn ${v === 'primary' ? '' : v} ${block ? 'block' : ''} ${extra}`.replace(/\s+/g, ' ').trim()

export function Button({ variant = 'primary', block, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; block?: boolean }) {
  return <button type="button" {...p} className={cls(variant, block, className)} />
}
export function LinkButton({ variant = 'primary', block, className, ...p }: LinkProps & { variant?: Variant; block?: boolean }) {
  return <Link {...p} className={cls(variant, block, className)} />
}
export function Card({ children, ornate, className = '', ...rest }: { children: ReactNode; ornate?: boolean; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`card ${ornate ? 'ornate' : ''} ${className}`}>{children}</div>
}

type BadgeKind = 'success' | 'error' | 'attention' | 'neutral'
const BADGE_ICON: Record<BadgeKind, string> = { success: '✓', error: '✕', attention: '!', neutral: '•' }
/** Статус: цвет + значок + текст (не только цветом). */
export function Badge({ kind = 'neutral', children }: { kind?: BadgeKind; children: ReactNode }) {
  return <span className={`badge ${kind}`}><span aria-hidden="true">{BADGE_ICON[kind]}</span>{children}</span>
}

export const Chinese = ({ children, className = 'zh-word' }: { children: ReactNode; className?: string }) => <span lang="zh-CN" className={className}>{children}</span>
export const Pinyin = ({ children, className = '' }: { children: ReactNode; className?: string }) => <span lang="zh-Latn-pinyin" className={`pinyin ${className}`}>{children}</span>

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} из ${max}`} className="progress">
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <Card className="stack" style={{ textAlign: 'center', alignItems: 'center' }}><h2>{title}</h2><p className="muted" style={{ fontSize: '1rem' }}>{text}</p>{action}</Card>
}
export function ErrorState({ title = 'Что-то пошло не так', text, onRetry }: { title?: string; text: string; onRetry?: () => void }) {
  return (
    <Card className="stack" role="alert">
      <h2>{title}</h2><p>{text}</p>
      {onRetry && <Button onClick={onRetry}>Попробовать ещё раз</Button>}
    </Card>
  )
}

let current: HTMLAudioElement | null = null
export function playWord(w: Word) {
  try {
    current?.pause()
    current = new Audio(audioUrl(w))
    void current.play().catch(() => undefined)
  } catch { /* звук недоступен — не мешаем учёбе */ }
}
export function AudioButton({ word, label }: { word: Word; label?: string }) {
  return (
    <button type="button" className="icon-btn" aria-label={label ?? `Озвучить: ${word.hanzi}`} onClick={(e) => { e.stopPropagation(); playWord(word) }}>
      <Icon name="sound" />
    </button>
  )
}

const PATHS: Record<string, ReactNode> = {
  home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  cards: <><rect x="3" y="6" width="14" height="14" rx="2" /><path d="M7 6V4h13a1 1 0 0 1 1 1v13h-2" /></>,
  practice: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></>,
  dict: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L21 21" /></>,
  progress: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  sound: <><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></>,
  close: <path d="M5 5l14 14M19 5L5 19" />,
  pen: <path d="M4 20l1-4L17 4l3 3L8 19zM14 7l3 3" />,
  back: <path d="M15 5l-7 7 7 7" />,
}
export function Icon({ name, size = 24 }: { name: keyof typeof PATHS | string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{PATHS[name]}</svg>
}

export function PageTitle({ title, zh, back }: { title: string; zh?: string; back?: string }) {
  return (
    <div className="page-title">
      <div className="row">
        {back && <Link to={back} className="icon-btn" aria-label="Назад"><Icon name="back" /></Link>}
        <h1>{title}</h1>
      </div>
      {zh && <Chinese className="zh">{zh}</Chinese>}
    </div>
  )
}
