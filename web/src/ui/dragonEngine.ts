// Анимированный китайский дракон: цепочка сегментов, следующая за «головой», движущейся по плавной кривой.
import { palette } from './tokens/tokens'

interface Pt { x: number; y: number }
export interface DragonOptions { scale: number; speed: number; yCenter: number; yAmp: number }

const N = 70

export class DragonScene {
  private pts: Pt[] = []
  private t = 0
  private w = 0
  private h = 0
  private opts: DragonOptions = { scale: 1, speed: 1, yCenter: 0.5, yAmp: 0.3 }
  constructor(private ctx: CanvasRenderingContext2D) {}

  resize(w: number, h: number, opts: DragonOptions) {
    this.w = w; this.h = h; this.opts = opts
    const head = this.headAt(this.t)
    this.pts = Array.from({ length: N }, (_, i) => ({ x: head.x - i * this.seg(), y: head.y }))
  }

  private seg() { return 11 * this.opts.scale }

  private headAt(t: number): Pt {
    const { w, h } = this
    return {
      x: w * (0.5 + 0.44 * Math.sin(t * 0.21) * Math.cos(t * 0.05)),
      y: h * (this.opts.yCenter + this.opts.yAmp * Math.sin(t * 0.33 + 1.2) + this.opts.yAmp * 0.25 * Math.sin(t * 0.9)),
    }
  }

  step(dt: number) {
    this.t += dt * this.opts.speed
    const head = this.headAt(this.t)
    this.pts[0] = head
    const L = this.seg()
    for (let i = 1; i < N; i++) {
      const a = this.pts[i - 1], b = this.pts[i]
      const dx = b.x - a.x, dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1
      this.pts[i] = { x: a.x + (dx / d) * L, y: a.y + (dy / d) * L }
    }
  }

  /** Центр тела с волной. */
  private body(): Pt[] {
    const out: Pt[] = []
    for (let i = 0; i < N; i++) {
      const p = this.pts[i], q = this.pts[Math.min(i + 1, N - 1)], r = this.pts[Math.max(i - 1, 0)]
      const ang = Math.atan2(r.y - q.y, r.x - q.x)
      const wave = Math.sin(i * 0.28 - this.t * 3.2) * (3 + i * 0.12) * this.opts.scale
      out.push({ x: p.x + Math.cos(ang + Math.PI / 2) * wave, y: p.y + Math.sin(ang + Math.PI / 2) * wave })
    }
    return out
  }

  private width(i: number) {
    const k = i / (N - 1)
    const base = k < 0.06 ? 10 + k * 150 : 19 * (1 - Math.pow(k, 1.4)) + 2
    return base * 1.35 * this.opts.scale
  }

  draw() {
    const { ctx } = this
    ctx.clearRect(0, 0, this.w, this.h)
    const b = this.body()
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'

    // хвост-плавник
    this.drawTailFin(b)
    // ноги (за телом)
    for (const idx of [14, 38]) this.drawLegs(b, idx)

    const pass = (wMul: number, extra: number, color: string, alpha = 1) => {
      ctx.globalAlpha = alpha; ctx.strokeStyle = color
      for (let i = N - 2; i >= 0; i--) {
        ctx.lineWidth = this.width(i) * wMul + extra
        ctx.beginPath(); ctx.moveTo(b[i + 1].x, b[i + 1].y); ctx.lineTo(b[i].x, b[i].y); ctx.stroke()
      }
      ctx.globalAlpha = 1
    }
    pass(1, 4, palette.ink)
    pass(1, 0, palette.crimson)
    pass(0.55, 0, '#b3202f', 0.9)
    pass(0.22, 0, palette.goldLight, 0.55)

    // чешуя
    ctx.strokeStyle = 'rgba(42,10,15,0.45)'; ctx.lineWidth = 1.2 * this.opts.scale
    for (let i = 4; i < N - 4; i += 2) {
      const w = this.width(i) * 0.36
      ctx.beginPath(); ctx.arc(b[i].x, b[i].y, w, 0, Math.PI); ctx.stroke()
    }
    // гребень-шипы
    ctx.fillStyle = palette.gold; ctx.strokeStyle = palette.ink; ctx.lineWidth = 1
    for (let i = 5; i < N - 6; i += 2) this.spine(b, i)

    this.drawHead(b)
  }

  private normal(b: Pt[], i: number) {
    const p = b[Math.max(i - 1, 0)], q = b[Math.min(i + 1, N - 1)]
    const a = Math.atan2(p.y - q.y, p.x - q.x)
    return { tx: Math.cos(a), ty: Math.sin(a), nx: Math.cos(a - Math.PI / 2), ny: Math.sin(a - Math.PI / 2) }
  }

  private spine(b: Pt[], i: number) {
    const { ctx } = this
    const { tx, ty, nx, ny } = this.normal(b, i)
    const w = this.width(i) / 2, len = (5 + (1 - i / N) * 8) * this.opts.scale
    ctx.beginPath()
    ctx.moveTo(b[i].x + nx * w - tx * 3, b[i].y + ny * w - ty * 3)
    ctx.lineTo(b[i].x + nx * (w + len) + tx * 4, b[i].y + ny * (w + len) + ty * 4)
    ctx.lineTo(b[i].x + nx * w + tx * 4, b[i].y + ny * w + ty * 4)
    ctx.closePath(); ctx.fill(); ctx.stroke()
  }

  private drawLegs(b: Pt[], i: number) {
    const { ctx } = this
    const { tx, ty, nx, ny } = this.normal(b, i)
    const s = this.opts.scale
    ctx.strokeStyle = palette.ink; ctx.fillStyle = palette.crimsonDark
    for (const side of [-1, 1]) {
      const sw = Math.sin(this.t * 2.4 + i) * 4 * s
      const x0 = b[i].x + nx * side * 8 * s, y0 = b[i].y + ny * side * 8 * s
      const x1 = x0 + nx * side * 20 * s - tx * 10 * s + sw, y1 = y0 + ny * side * 20 * s - ty * 10 * s
      const x2 = x1 + nx * side * 12 * s - tx * 14 * s, y2 = y1 + ny * side * 12 * s - ty * 14 * s
      ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      ctx.strokeStyle = palette.crimson; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
      ctx.strokeStyle = palette.gold; ctx.lineWidth = 1.8 * s
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath(); ctx.moveTo(x2, y2)
        ctx.lineTo(x2 + nx * side * 7 * s - tx * (5 + c * 5) * s, y2 + ny * side * 7 * s - ty * (5 + c * 5) * s); ctx.stroke()
      }
      ctx.strokeStyle = palette.ink
    }
  }

  private drawTailFin(b: Pt[]) {
    const { ctx } = this
    const i = N - 2, s = this.opts.scale
    const { tx, ty, nx, ny } = this.normal(b, i)
    ctx.fillStyle = palette.crimson; ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5
    for (let k = -2; k <= 2; k++) {
      const sway = Math.sin(this.t * 3 + k) * 3 * s
      ctx.beginPath()
      ctx.moveTo(b[i].x, b[i].y)
      ctx.quadraticCurveTo(b[i].x - tx * 14 * s + nx * k * 10 * s, b[i].y - ty * 14 * s + ny * k * 10 * s,
        b[i].x - tx * (30 + Math.abs(k) * -3) * s + nx * k * 16 * s + sway, b[i].y - ty * (30 - Math.abs(k) * 3) * s + ny * k * 16 * s)
      ctx.quadraticCurveTo(b[i].x - tx * 14 * s + nx * (k + 0.6) * 9 * s, b[i].y - ty * 14 * s + ny * (k + 0.6) * 9 * s, b[i].x, b[i].y)
      ctx.fill(); ctx.stroke()
    }
  }

  private drawHead(b: Pt[]) {
    const { ctx } = this
    const s = this.opts.scale
    const a = Math.atan2(b[0].y - b[3].y, b[0].x - b[3].x)
    const flip = Math.cos(a) < 0 ? -1 : 1 // чтобы голова не была вверх ногами при движении влево
    ctx.save()
    ctx.translate(b[0].x, b[0].y); ctx.rotate(a)
    ctx.scale(s * 1.15, s * 1.15 * flip)
    const wob = Math.sin(this.t * 3.2) * 2

    // усы
    ctx.strokeStyle = palette.gold; ctx.lineWidth = 2.2; ctx.lineCap = 'round'
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(30, sd * 5)
      ctx.bezierCurveTo(44, sd * (16 + wob), 70 + wob * 2, sd * (34 - wob), 96, sd * (22 + wob * 2)); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(8, sd * 12)
      ctx.bezierCurveTo(20, sd * (30 + wob), 44, sd * (44 - wob), 64, sd * (50 + wob * 2)); ctx.stroke()
    }
    // грива
    ctx.fillStyle = palette.gold; ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.2
    for (let k = 0; k < 5; k++) {
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(-6 - k * 7, sd * 12)
        ctx.quadraticCurveTo(-24 - k * 8, sd * (22 + wob), -34 - k * 9, sd * (10 + k * 2 + wob)); ctx.quadraticCurveTo(-16 - k * 7, sd * 14, -2 - k * 7, sd * 14)
        ctx.fill(); ctx.stroke()
      }
    }
    // рога
    ctx.strokeStyle = palette.goldLight; ctx.lineWidth = 4.5
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(14, sd * 9); ctx.quadraticCurveTo(0, sd * 26, -26, sd * 24 + wob * sd); ctx.stroke()
    }
    ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.2
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(14, sd * 9); ctx.quadraticCurveTo(0, sd * 26, -26, sd * 24 + wob * sd); ctx.stroke() }

    // череп и морда
    ctx.fillStyle = palette.crimson; ctx.strokeStyle = palette.ink; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-14, -12)
    ctx.bezierCurveTo(10, -18, 30, -14, 46, -10)           // лоб → нос
    ctx.bezierCurveTo(56, -8, 58, -2, 54, 0)               // кончик носа
    ctx.lineTo(24, 2)
    ctx.bezierCurveTo(30, 8, 24, 16, 10, 15)               // подбородок
    ctx.bezierCurveTo(-4, 16, -14, 12, -14, 0)
    ctx.closePath(); ctx.fill(); ctx.stroke()
    // нижняя челюсть, приоткрытая
    const jaw = 4 + Math.sin(this.t * 2) * 2
    ctx.fillStyle = palette.crimsonDark
    ctx.beginPath(); ctx.moveTo(52, 1); ctx.lineTo(18, 4 + jaw); ctx.bezierCurveTo(24, 14 + jaw, 40, 12 + jaw, 50, 6 + jaw); ctx.closePath(); ctx.fill(); ctx.stroke()
    // клыки
    ctx.fillStyle = palette.ivory
    for (const x of [44, 34]) { ctx.beginPath(); ctx.moveTo(x, 1); ctx.lineTo(x - 2, 8 + jaw * 0.6); ctx.lineTo(x + 3, 1); ctx.fill() }
    // ноздря, бровь, глаз
    ctx.fillStyle = palette.ink; ctx.beginPath(); ctx.arc(50, -6, 1.8, 0, 7); ctx.fill()
    ctx.strokeStyle = palette.goldLight; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(8, -9); ctx.quadraticCurveTo(20, -18, 30, -10); ctx.stroke()
    ctx.fillStyle = palette.goldLight; ctx.strokeStyle = palette.ink; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.ellipse(18, -4, 6, 4.6, -0.2, 0, 7); ctx.fill(); ctx.stroke()
    ctx.fillStyle = palette.ink; ctx.beginPath(); ctx.ellipse(19, -4, 2, 3.8, 0, 0, 7); ctx.fill()
    ctx.restore()
  }
}
