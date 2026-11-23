// Дракон в духе китайской живописи на свитках: тушь, киноварь, золото, жемчужина и облака.
import { palette } from './tokens/tokens'

interface Pt { x: number; y: number }
export interface DragonOptions { scale: number; speed: number; yCenter: number; yAmp: number }

const N = 96
const INK = palette.ink
const VERMILION = '#c8281c'

export class DragonScene {
  private pts: Pt[] = []
  private t = 0
  private w = 0
  private h = 0
  private flipY = 1
  private opts: DragonOptions = { scale: 1, speed: 1, yCenter: 0.5, yAmp: 0.3 }
  // рабочие массивы кадра
  private b: Pt[] = []
  private tx: number[] = []
  private ty: number[] = []
  private nx: number[] = []
  private ny: number[] = []
  private s: number[] = []
  private wd: number[] = []
  constructor(private ctx: CanvasRenderingContext2D) {}

  resize(w: number, h: number, opts: DragonOptions) {
    this.w = w; this.h = h; this.opts = opts
    const head = this.pathAt(this.t)
    this.pts = Array.from({ length: N }, (_, i) => ({ x: head.x - i * this.seg(), y: head.y }))
    this.compute()
  }

  private seg() { return 9.5 * this.opts.scale }

  private pathAt(t: number): Pt {
    const { w, h } = this
    return {
      x: w * (0.5 + 0.46 * Math.sin(t * 0.19) * Math.cos(t * 0.046)),
      y: h * (this.opts.yCenter + this.opts.yAmp * Math.sin(t * 0.31 + 1.2) + this.opts.yAmp * 0.28 * Math.sin(t * 0.83)),
    }
  }

  step(dt: number) {
    this.t += dt * this.opts.speed
    this.pts[0] = this.pathAt(this.t)
    const L = this.seg()
    for (let i = 1; i < N; i++) {
      const a = this.pts[i - 1], b = this.pts[i]
      const dx = b.x - a.x, dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1
      this.pts[i] = { x: a.x + (dx / d) * L, y: a.y + (dy / d) * L }
    }
    this.compute()
    const target = this.tx[0] < 0 ? -1 : 1
    this.flipY += (target - this.flipY) * Math.min(1, dt * 5)
  }

  private width(i: number) {
    const k = i / (N - 1)
    const base = k < 0.1 ? 16 + (k / 0.1) * 24 : 40 * (1 - Math.pow((k - 0.1) / 0.9, 1.3)) + 3
    return base * this.opts.scale
  }

  /** Центр тела с волной, касательные, нормали и «поворот» брюха. */
  private compute() {
    const sc = this.opts.scale
    for (let i = 0; i < N; i++) {
      const p = this.pts[i], nx = this.pts[Math.min(i + 1, N - 1)], pv = this.pts[Math.max(i - 1, 0)]
      let tx = pv.x - nx.x, ty = pv.y - nx.y
      const d = Math.hypot(tx, ty) || 1
      tx /= d; ty /= d
      const wave = Math.sin(i * 0.26 - this.t * 3) * (2 + i * 0.07) * sc
      this.tx[i] = tx; this.ty[i] = ty
      this.nx[i] = -ty; this.ny[i] = tx // нормаль
      this.b[i] = { x: p.x - ty * wave, y: p.y + tx * wave }
      this.s[i] = Math.tanh(2.6 * this.ny[i])  // >0: нормаль смотрит вниз
      this.wd[i] = this.width(i)
    }
  }

  draw() {
    const { ctx } = this
    ctx.clearRect(0, 0, this.w, this.h)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    this.drawClouds()
    this.drawPearl()
    this.drawTail()
    for (const i of [58, 64]) this.drawLeg(i)
    this.drawBody()
    this.drawBelly()
    this.drawScales()
    this.drawFins()
    for (const i of [17, 23]) this.drawLeg(i)
    this.drawHead()
  }

  // ---------- облака ----------
  private drawClouds() {
    const { ctx } = this
    const sc = this.opts.scale
    ctx.strokeStyle = 'rgba(169,122,31,0.55)'; ctx.fillStyle = 'rgba(226,189,106,0.16)'; ctx.lineWidth = 2 * sc
    for (const [i, r, ph] of [[26, 46, 0], [50, 60, 2], [76, 40, 4]] as const) {
      const p = this.b[i]; const drift = Math.sin(this.t * 0.7 + ph) * 6 * sc
      const cx = p.x + this.nx[i] * (r * 0.9 * sc) + drift, cy = p.y + this.ny[i] * (r * 0.9 * sc)
      const R = r * sc
      ctx.beginPath()
      ctx.arc(cx - R * 0.5, cy, R * 0.45, Math.PI, 0); ctx.arc(cx, cy - R * 0.25, R * 0.55, Math.PI, 0); ctx.arc(cx + R * 0.55, cy, R * 0.4, Math.PI, 0)
      ctx.lineTo(cx + R * 0.95, cy + R * 0.15); ctx.lineTo(cx - R * 0.95, cy + R * 0.15); ctx.closePath()
      ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - R * 0.05, cy - R * 0.2, R * 0.2, 0.4, Math.PI * 1.6); ctx.stroke()
    }
  }

  // ---------- жемчужина ----------
  private drawPearl() {
    const { ctx } = this
    const sc = this.opts.scale
    const p = this.pathAt(this.t + 1.15 * this.opts.speed)
    const R = 15 * sc
    const g = ctx.createRadialGradient(p.x - R * 0.3, p.y - R * 0.3, R * 0.1, p.x, p.y, R)
    g.addColorStop(0, '#fff6d6'); g.addColorStop(0.5, palette.goldLight); g.addColorStop(1, palette.gold)
    ctx.fillStyle = VERMILION; ctx.strokeStyle = INK; ctx.lineWidth = 1.2
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + this.t * 1.6
      const l = R * (1.7 + 0.35 * Math.sin(this.t * 4 + k))
      ctx.beginPath(); ctx.moveTo(p.x + Math.cos(a - 0.3) * R * 0.8, p.y + Math.sin(a - 0.3) * R * 0.8)
      ctx.quadraticCurveTo(p.x + Math.cos(a + 0.5) * l * 0.9, p.y + Math.sin(a + 0.5) * l * 0.9, p.x + Math.cos(a + 0.2) * l, p.y + Math.sin(a + 0.2) * l)
      ctx.quadraticCurveTo(p.x + Math.cos(a + 0.1) * R * 1.1, p.y + Math.sin(a + 0.1) * R * 1.1, p.x + Math.cos(a + 0.3) * R * 0.8, p.y + Math.sin(a + 0.3) * R * 0.8)
      ctx.fill(); ctx.stroke()
    }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, 7); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, R * 0.62, 3.6, 4.6); ctx.stroke()
  }

  // ---------- тело ----------
  private edge(i: number, off: number): Pt { return { x: this.b[i].x + this.nx[i] * off, y: this.b[i].y + this.ny[i] * off } }

  private bodyPath(grow: number, from = 0, to = N - 1) {
    const { ctx } = this
    ctx.beginPath()
    for (let i = from; i <= to; i++) { const e = this.edge(i, this.wd[i] / 2 + grow); if (i === from) ctx.moveTo(e.x, e.y); else ctx.lineTo(e.x, e.y) }
    for (let i = to; i >= from; i--) { const e = this.edge(i, -this.wd[i] / 2 - grow); ctx.lineTo(e.x, e.y) }
    ctx.closePath()
  }

  private drawBody() {
    const { ctx } = this
    const sc = this.opts.scale
    this.bodyPath(2.2 * sc); ctx.fillStyle = INK; ctx.fill()
    this.bodyPath(0)
    const g = ctx.createLinearGradient(this.b[0].x, this.b[0].y, this.b[N - 1].x, this.b[N - 1].y)
    g.addColorStop(0, '#7d1020'); g.addColorStop(0.5, '#5e0a17'); g.addColorStop(1, '#3a0610')
    ctx.fillStyle = g; ctx.fill()
    // мазок киновари вдоль спины
    ctx.lineWidth = 3 * sc; ctx.strokeStyle = 'rgba(200,40,28,0.55)'
    for (let i = 3; i < N - 8; i++) {
      const sgn = -Math.sign(this.s[i] || 1), a = this.edge(i, sgn * this.wd[i] * 0.34), b = this.edge(i + 1, sgn * this.wd[i + 1] * 0.34)
      ctx.globalAlpha = Math.min(1, Math.abs(this.s[i]) * 1.6 + 0.2)
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  private drawBelly() {
    const { ctx } = this
    for (let i = 2; i < N - 4; i++) {
      const s = this.s[i], s2 = this.s[i + 1], wd = this.wd[i], wd2 = this.wd[i + 1]
      if (Math.abs(s) < 0.12) continue
      const a1 = this.edge(i, s * wd * 0.46), a2 = this.edge(i, s * wd * 0.1)
      const b1 = this.edge(i + 1, s2 * wd2 * 0.46), b2 = this.edge(i + 1, s2 * wd2 * 0.1)
      ctx.fillStyle = i % 2 ? '#ecd9a6' : '#d9b972'
      ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y); ctx.lineTo(a2.x, a2.y); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(42,10,15,0.55)'; ctx.lineWidth = 1; ctx.stroke()
    }
  }

  private drawScales() {
    const { ctx } = this
    const sc = this.opts.scale
    ctx.lineWidth = 1.3 * sc
    for (let i = 4; i < N - 6; i += 2) {
      const wd = this.wd[i]
      for (const off of [-0.3, 0.02, 0.3]) {
        const p = this.edge(i, off * wd + (i % 4 ? 0 : 0.1 * wd))
        const a = Math.atan2(this.ty[i], this.tx[i])
        ctx.strokeStyle = 'rgba(226,189,106,0.7)'
        ctx.beginPath(); ctx.arc(p.x, p.y, wd * 0.2, a + Math.PI * 0.5, a + Math.PI * 1.5); ctx.stroke()
      }
    }
  }

  private flame(x: number, y: number, dx: number, dy: number, wBase: number, fill: string) {
    const { ctx } = this
    const l = Math.hypot(dx, dy) || 1
    const px = (-dy / l) * wBase, py = (dx / l) * wBase
    ctx.beginPath()
    ctx.moveTo(x + px, y + py)
    ctx.quadraticCurveTo(x + dx * 0.55 + px * 0.9, y + dy * 0.55 + py * 0.9, x + dx, y + dy)
    ctx.quadraticCurveTo(x + dx * 0.45 - px * 0.2, y + dy * 0.45 - py * 0.2, x - px, y - py)
    ctx.closePath()
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.1; ctx.stroke()
  }

  private drawFins() {
    const sc = this.opts.scale
    for (let i = 3; i < N - 5; i += 3) {
      const k = i / N
      const len = (i < 16 ? 36 - i * 1 : 26 * (1 - k) + 6) * sc
      const sway = Math.sin(this.t * 3 + i * 0.4) * 5 * sc
      for (const side of [-1, 1]) {
        const wBack = Math.max(0, Math.min(1, 0.5 + side * -this.s[i] * 1.2))
        if (wBack < 0.15) continue
        const base = this.edge(i, side * this.wd[i] * 0.5)
        const L = len * wBack
        this.flame(base.x, base.y, this.nx[i] * side * L - this.tx[i] * L * 0.9 + sway * this.nx[i], this.ny[i] * side * L - this.ty[i] * L * 0.9 + sway * this.ny[i],
          3.8 * sc * wBack, i < 14 ? VERMILION : i % 4 ? '#a8202f' : palette.gold)
      }
    }
  }

  private drawTail() {
    const sc = this.opts.scale
    const i = N - 1
    const p = this.b[i]
    for (let k = -2; k <= 2; k++) {
      const sway = Math.sin(this.t * 3 + k * 0.8) * 10 * sc
      this.flame(p.x, p.y, -this.tx[i] * (46 - Math.abs(k) * 6) * sc + this.nx[i] * (k * 12 * sc + sway), -this.ty[i] * (46 - Math.abs(k) * 6) * sc + this.ny[i] * (k * 12 * sc + sway), 3.5 * sc, k % 2 ? palette.gold : VERMILION)
    }
  }

  private drawLeg(i: number) {
    const { ctx } = this
    const sc = this.opts.scale
    const sg = this.s[i] >= 0 ? 1 : -1
    const ox = this.nx[i] * sg, oy = this.ny[i] * sg
    const hip = this.edge(i, sg * this.wd[i] * 0.38)
    const swing = Math.sin(this.t * 2.2 + i) * 6 * sc
    const knee = { x: hip.x + ox * 22 * sc - this.tx[i] * (10 * sc) + this.tx[i] * swing * 0.3, y: hip.y + oy * 22 * sc - this.ty[i] * (10 * sc) + this.ty[i] * swing * 0.3 }
    const foot = { x: knee.x + ox * 18 * sc + this.tx[i] * (12 * sc + swing), y: knee.y + oy * 18 * sc + this.ty[i] * (12 * sc + swing) }
    for (const [w, col] of [[11 * sc, INK], [7.5 * sc, '#6e0f1c']] as const) {
      ctx.strokeStyle = col; ctx.lineWidth = w
      ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(knee.x, knee.y); ctx.lineTo(foot.x, foot.y); ctx.stroke()
    }
    // шерсть на колене
    for (let k = 0; k < 3; k++) this.flame(knee.x, knee.y, -this.tx[i] * 16 * sc + ox * (k - 1) * 8 * sc, -this.ty[i] * 16 * sc + oy * (k - 1) * 8 * sc, 2.2 * sc, VERMILION)
    // когти
    ctx.strokeStyle = palette.goldLight; ctx.lineWidth = 2.4 * sc
    for (let k = -1; k <= 2; k++) {
      const a = Math.atan2(oy, ox) + (k - 0.5) * 0.55
      ctx.beginPath(); ctx.moveTo(foot.x, foot.y)
      ctx.quadraticCurveTo(foot.x + Math.cos(a) * 9 * sc, foot.y + Math.sin(a) * 9 * sc, foot.x + Math.cos(a + 0.5 * sg) * 13 * sc + this.tx[i] * 3 * sc, foot.y + Math.sin(a + 0.5 * sg) * 13 * sc + this.ty[i] * 3 * sc); ctx.stroke()
    }
  }

  // ---------- голова ----------
  private drawHead() {
    const { ctx } = this
    const sc = this.opts.scale
    const head = this.b[0]
    const fl = this.flipY
    const wob = Math.sin(this.t * 3.2) * 3
    const jaw = 5 + Math.sin(this.t * 1.7) * 3
    ctx.save()
    ctx.translate(head.x, head.y); ctx.rotate(Math.atan2(this.ty[0], this.tx[0]))
    ctx.scale(sc * 1.75, sc * 1.75 * fl)

    // грива
    for (let k = 0; k < 6; k++) {
      const fl2 = Math.sin(this.t * 4 + k) * 4
      this.flame(-4 - k * 3, -14 + k * 2, -34 - k * 7, -6 + fl2 - k * 3, 4.2, k % 2 ? palette.gold : VERMILION)
      this.flame(-4 - k * 3, 8 - k * 1, -30 - k * 6, 8 + fl2 + k * 3, 3.6, k % 2 ? VERMILION : palette.gold)
    }
    // усы
    ctx.lineWidth = 2.6; ctx.strokeStyle = palette.gold
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(56, sd * 4 - 4)
      ctx.bezierCurveTo(44, sd * (30 + wob), 10, sd * (28 - wob), -26 + wob * 2, sd * (38 + wob)); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(60, sd * 5 - 2)
      ctx.bezierCurveTo(74, sd * (28 + wob), 52, sd * (46 - wob), 20, sd * (56 + wob * 2)); ctx.stroke()
    }
    // рога-оленьи
    ctx.lineCap = 'round'
    for (const [w, col] of [[7, INK], [4.2, '#c89b3c']] as const) {
      ctx.strokeStyle = col; ctx.lineWidth = w
      ctx.beginPath(); ctx.moveTo(14, -20); ctx.bezierCurveTo(2, -36, -22, -40 + wob, -46, -52 + wob); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-8, -38); ctx.quadraticCurveTo(-8, -52, -22, -60); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-26, -43); ctx.quadraticCurveTo(-30, -54, -42, -62); ctx.stroke()
    }
    // бородка
    this.flame(50, 16, -6, 30, 3, VERMILION); this.flame(42, 17, -14, 26, 2.6, palette.gold)

    // пасть изнутри
    ctx.fillStyle = '#2a0508'; ctx.strokeStyle = INK; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(60, -2); ctx.lineTo(8, 0); ctx.lineTo(10, 8 + jaw); ctx.lineTo(58, 6 + jaw); ctx.closePath(); ctx.fill()
    // язык
    ctx.fillStyle = '#d6404a'; ctx.beginPath(); ctx.moveTo(14, 5 + jaw * 0.5); ctx.quadraticCurveTo(36, 3 + jaw * 0.7, 52, 3 + jaw * 0.9); ctx.quadraticCurveTo(34, 10 + jaw * 0.8, 14, 5 + jaw * 0.5); ctx.fill()
    // нижняя челюсть
    ctx.fillStyle = '#5a0a16'
    ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(30, 6 + jaw * 0.6); ctx.lineTo(60, 4 + jaw); ctx.quadraticCurveTo(66, 8 + jaw, 58, 12 + jaw); ctx.lineTo(40, 17 + jaw); ctx.quadraticCurveTo(14, 18 + jaw * 0.5, -4, 10); ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.fillStyle = palette.ivory
    for (const x of [54, 42]) { ctx.beginPath(); ctx.moveTo(x, 6 + jaw); ctx.lineTo(x + 2, 6 + jaw - 7); ctx.lineTo(x - 3, 6 + jaw); ctx.closePath(); ctx.fill() }
    // череп и морда
    ctx.fillStyle = '#7d1020'
    ctx.beginPath()
    ctx.moveTo(-8, -10)
    ctx.bezierCurveTo(-4, -26, 14, -28, 26, -22)                 // лоб
    ctx.bezierCurveTo(36, -19, 44, -17, 54, -19)                 // переносица
    ctx.bezierCurveTo(64, -21, 70, -17, 66, -11)                 // вздёрнутый нос
    ctx.bezierCurveTo(70, -6, 66, -2, 60, -1)                    // верхняя губа
    ctx.lineTo(30, 0); ctx.lineTo(8, 1); ctx.bezierCurveTo(-6, 2, -10, -4, -8, -10)
    ctx.closePath(); ctx.fill(); ctx.stroke()
    // клыки верхние
    ctx.fillStyle = palette.ivory
    for (const x of [58, 44]) { ctx.beginPath(); ctx.moveTo(x, -1); ctx.lineTo(x + 1, 8); ctx.lineTo(x - 4, -1); ctx.closePath(); ctx.fill() }
    // золотые складки морды и ноздря
    ctx.strokeStyle = palette.goldLight; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(48, -16); ctx.quadraticCurveTo(58, -18, 62, -12); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(18, -4); ctx.quadraticCurveTo(30, -6, 40, -5); ctx.stroke()
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(61, -10, 3, 2.2, 0.4, 0, 7); ctx.fill()
    // бровь-пламя
    this.flame(14, -18, 22, -8 + wob * 0.4, 3, VERMILION)
    // глаз
    ctx.fillStyle = palette.goldLight; ctx.strokeStyle = INK; ctx.lineWidth = 1.8
    ctx.beginPath(); ctx.moveTo(14, -11); ctx.quadraticCurveTo(24, -19, 33, -11); ctx.quadraticCurveTo(24, -6, 14, -11); ctx.fill(); ctx.stroke()
    ctx.fillStyle = VERMILION; ctx.beginPath(); ctx.arc(24, -12, 4, 0, 7); ctx.fill()
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(24.5, -12, 1.5, 3.6, 0, 0, 7); ctx.fill()
    ctx.restore()
  }
}
