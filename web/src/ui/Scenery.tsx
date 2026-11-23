import type { CSSProperties } from 'react'

const roof = (cx: number, y: number, rw: number, rh: number) =>
  `M${cx - rw} ${y - 9} Q${cx - rw * 0.55} ${y - 1} ${cx - rw * 0.16} ${y - rh} L${cx + rw * 0.16} ${y - rh} Q${cx + rw * 0.55} ${y - 1} ${cx + rw} ${y - 9} Q${cx + rw * 0.5} ${y + 8} ${cx} ${y + 7} Q${cx - rw * 0.5} ${y + 8} ${cx - rw} ${y - 9}Z`

/** Многоярусная пагода. Рисуется силуэтом цвета currentColor с золотыми акцентами. */
export function Pagoda({ tiers = 7, x = 0, y = 0, scale = 1 }: { tiers?: number; x?: number; y?: number; scale?: number }) {
  const parts = []
  let top = 250
  for (let i = 0; i < tiers; i++) {
    const k = i / Math.max(tiers - 1, 1)
    const bw = 56 - k * 30, rw = 46 - k * 26, h = 18 - k * 3
    parts.push(
      <g key={i}>
        <rect x={60 - bw / 2} y={top - h} width={bw} height={h} />
        <path d={roof(60, top - h, rw, 16)} />
        <rect className="gold" x={60 - bw / 2 + 4} y={top - h + 4} width={bw - 8} height={3} />
      </g>,
    )
    top -= h + 11
  }
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="22" y="250" width="76" height="8" />
      <rect x="14" y="258" width="92" height="8" />
      {parts}
      <rect x="59" y={top - 30} width="2" height="34" />
      <circle className="gold" cx="60" cy={top - 16} r="4" />
      <circle className="gold" cx="60" cy={top - 26} r="2.6" />
    </g>
  )
}

/** Ворота пайфан (牌坊) с тремя проёмами. */
export function Paifang({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {[10, 70, 130, 190].map((cx) => <rect key={cx} x={cx} y="40" width="10" height="110" />)}
      <rect x="4" y="82" width="202" height="8" />
      <rect x="4" y="116" width="202" height="5" />
      <path d={roof(105, 38, 92, 22)} />
      <path d={roof(40, 52, 40, 12)} />
      <path d={roof(170, 52, 40, 12)} />
      <rect className="gold" x="82" y="56" width="46" height="22" rx="2" />
      <text x="105" y="73" textAnchor="middle" fontSize="16" fill="#7a0f1f" fontFamily="PingFang SC, Noto Sans SC, serif" fontWeight="700">学海</text>
      <circle className="gold" cx="105" cy="14" r="4" />
      <rect x="104" y="14" width="2" height="12" />
    </g>
  )
}

export function Mountains() {
  return (
    <g className="mtn">
      <path d="M0 400 L0 300 Q60 230 130 290 Q200 190 290 280 Q350 230 420 300 L420 400Z" opacity=".55" />
      <path d="M780 400 L780 290 Q860 200 940 280 Q1010 220 1090 285 Q1150 240 1200 290 L1200 400Z" opacity=".55" />
    </g>
  )
}

/** Облако-сянъюнь (祥云): спираль с хвостом. */
export function Cloud({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g className="cloud" transform={`translate(${x} ${y}) scale(${scale})`} fill="none" strokeWidth="3" strokeLinecap="round">
      <path d="M0 30 Q10 6 30 14 Q38 -6 60 6 Q82 -2 88 22 Q106 20 104 38 L0 38Z" fill="currentColor" stroke="none" opacity=".35" />
      <path d="M22 26 q4-9 12-4 q6 5-1 9" />
      <path d="M64 24 q4-9 12-4 q6 5-1 9" />
    </g>
  )
}

export function Lantern({ style, size = 1 }: { style?: CSSProperties; size?: number }) {
  return (
    <svg className="lantern" viewBox="0 0 60 140" width={60 * size} height={140 * size} style={style} aria-hidden="true">
      <line x1="30" y1="0" x2="30" y2="26" stroke="#2a0a0f" strokeWidth="2" />
      <rect x="18" y="26" width="24" height="7" rx="2" fill="#d9a93e" stroke="#2a0a0f" />
      <ellipse cx="30" cy="62" rx="26" ry="30" fill="#b3182b" stroke="#2a0a0f" strokeWidth="2" />
      <path d="M30 32 Q12 62 30 92 M30 32 Q48 62 30 92 M30 32 L30 92" fill="none" stroke="#7a0f1f" strokeWidth="2" />
      <rect x="18" y="91" width="24" height="7" rx="2" fill="#d9a93e" stroke="#2a0a0f" />
      <g stroke="#d9a93e" strokeWidth="2.2"><line x1="30" y1="98" x2="30" y2="130" /><line x1="25" y1="98" x2="23" y2="126" /><line x1="35" y1="98" x2="37" y2="126" /></g>
      <text x="30" y="70" textAnchor="middle" fontSize="22" fill="#f1d48a" fontWeight="700" fontFamily="PingFang SC, Noto Sans SC, serif">福</text>
    </svg>
  )
}

/** Узор «хуэйвэнь» (回纹) — традиционная каёмка. */
export function Frieze({ className = '' }: { className?: string }) {
  return (
    <svg className={`frieze ${className}`} width="100%" height="14" aria-hidden="true" focusable="false">
      <defs>
        <pattern id="key" width="28" height="14" patternUnits="userSpaceOnUse">
          <path d="M2 12 V2 H26 V12 H8 V6 H20 V9" fill="none" stroke="#a97a1f" strokeWidth="1.8" />
        </pattern>
      </defs>
      <rect width="100%" height="14" fill="url(#key)" />
    </svg>
  )
}

/** Красная печать с иероглифом. */
export function Seal({ char = '汉', size = 44 }: { char?: string; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="6" fill="#9c1020" stroke="#5e0a17" strokeWidth="2" />
      <rect x="6" y="6" width="36" height="36" rx="3" fill="none" stroke="#f1d9c8" strokeWidth="1.5" opacity=".7" />
      <text x="24" y="35" textAnchor="middle" fontSize="28" fill="#fcf7ea" fontFamily="PingFang SC, Noto Sans SC, serif" fontWeight="700">{char}</text>
    </svg>
  )
}

/** Фон: горы, пагоды и ворота у нижнего края. Не интерактивен. */
export function Scenery({ variant }: { variant: 'hero' | 'ambient' }) {
  return (
    <svg className={`scenery ${variant}`} viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <Mountains />
      <g className="clouds">
        <Cloud x={120} y={60} scale={1.2} /><Cloud x={880} y={30} scale={1.5} /><Cloud x={520} y={110} scale={0.9} />
      </g>
      <g className="ink">
        <Pagoda tiers={7} x={170} y={82} scale={1.15} />
        <Pagoda tiers={5} x={900} y={122} scale={1.0} />
        <Paifang x={500} y={250} scale={0.95} />
        <rect x="0" y="388" width="1200" height="12" />
      </g>
    </svg>
  )
}
