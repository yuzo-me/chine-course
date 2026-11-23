import { useEffect, useRef } from 'react'
import { DragonScene } from './dragonEngine'

interface Props { variant: 'hero' | 'ambient' }

/** Фоновый дракон. Замирает при «уменьшить движение», в скрытой вкладке и когда выключен в настройках. */
export function Dragon({ variant }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const scene = new DragonScene(ctx)
    let raf = 0, last = 0, running = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const hero = variant === 'hero'
    const layout = () => {
      const w = window.innerWidth, h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const narrow = w < 600
      scene.resize(w, h, { scale: (hero ? 1.35 : 0.9) * (narrow ? 0.62 : 1), speed: hero ? 1 : 0.6, yCenter: hero ? (narrow ? 0.2 : 0.3) : 0.5, yAmp: hero ? (narrow ? 0.09 : 0.2) : 0.3 })
      scene.draw()
    }
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 33) return // не чаще ~30 кадров в секунду — бережём батарею телефона
      const dt = Math.min((now - last) / 1000, 0.1); last = now
      scene.step(dt); scene.draw()
    }
    const start = () => { if (!running && !reduce.matches && !document.hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(frame) } }
    const stop = () => { running = false; cancelAnimationFrame(raf) }
    const onVis = () => (document.hidden ? stop() : start())
    const onReduce = () => (reduce.matches ? stop() : start())
    layout(); start()
    window.addEventListener('resize', layout)
    document.addEventListener('visibilitychange', onVis)
    reduce.addEventListener('change', onReduce)
    return () => { stop(); window.removeEventListener('resize', layout); document.removeEventListener('visibilitychange', onVis); reduce.removeEventListener('change', onReduce) }
  }, [variant])
  return <canvas ref={ref} aria-hidden="true" data-testid="dragon"
    style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', zIndex: 0, pointerEvents: 'none', opacity: variant === 'hero' ? 0.97 : 0.32 }} />
}
