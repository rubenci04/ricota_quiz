// Respuestas visuales coordinadas con los sonidos: estallido de partículas, destello, sacudida,
// viñeta roja, contador de racha y luces de escenario al ganar. Todo original y liviano.
// Sin movimiento si el sistema pide reducirlo.

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const COLORES_OK = ['#6fe0aa', '#e0a526', '#9ff0dc', '#ffffff']
const COLORES_PISTA = ['#e0a526', '#f5d37a']

let canvas, ctx, frame = 0, particulas = [], luces = null
let racha = 0
let insignia = null
let rachaTimer = 0
let ultimo = { x: 0, y: 0 } // centro del último elemento tocado

function asegurarCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.className = 'fx-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    document.body.appendChild(canvas)
    ctx = canvas.getContext('2d')
  }
  return Boolean(ctx)
}

function ajustar() {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1)
  canvas.width = Math.round(window.innerWidth * dpr)
  canvas.height = Math.round(window.innerHeight * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function bucle(t) {
  const w = window.innerWidth, h = window.innerHeight
  ctx.clearRect(0, 0, w, h)
  if (luces) {
    const e = (t - luces.inicio) / 2200
    if (e >= 1) luces = null
    else {
      ctx.globalCompositeOperation = 'lighter'
      const alfa = Math.sin(Math.PI * e) * 0.35
      luces.haces.forEach((color, i) => {
        const ang = Math.sin(e * 5 + i * 1.7) * 0.5 + (i - 1.5) * 0.3
        const x0 = ((i + 0.5) / 4) * w, x1 = x0 + Math.sin(ang) * h, y1 = Math.cos(ang) * h
        const g = ctx.createLinearGradient(x0, 0, x1, y1)
        g.addColorStop(0, color + 'cc')
        g.addColorStop(1, color + '00')
        ctx.globalAlpha = alfa
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(x0 - 8, 0); ctx.lineTo(x0 + 8, 0); ctx.lineTo(x1 + 90, y1); ctx.lineTo(x1 - 90, y1)
        ctx.fill()
      })
      ctx.globalCompositeOperation = 'source-over'
    }
  }
  particulas = particulas.filter((p) => p.vida > 0)
  for (const p of particulas) {
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.12
    p.vida -= 1
    ctx.globalAlpha = Math.max(0, p.vida / p.total)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, 6.283)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  if (particulas.length || luces) frame = requestAnimationFrame(bucle)
  else { frame = 0; ctx.clearRect(0, 0, w, h) }
}

const arrancar = () => { if (!frame) frame = requestAnimationFrame(bucle) }

export function estallido(x = ultimo.x, y = ultimo.y, colores = COLORES_OK, cantidad = 16) {
  if (reducido() || !asegurarCanvas()) return
  ajustar()
  for (let i = 0; i < cantidad; i++) {
    const a = Math.random() * 6.283, v = 1.5 + Math.random() * 3.5
    const total = 28 + Math.random() * 18
    particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, r: 1.5 + Math.random() * 2.5, vida: total, total, color: colores[i % colores.length] })
  }
  arrancar()
}

export function lucesDeEscenario() {
  if (reducido() || !asegurarCanvas()) return
  ajustar()
  luces = { inicio: performance.now(), haces: ['#e0a526', '#e11d48', '#0ea5e9', '#10b981'] }
  arrancar()
}

// reinicia una animación CSS de una clase sobre un elemento
const animar = (el, clase) => {
  if (!el || reducido()) return
  el.classList.remove(clase)
  void el.offsetWidth
  el.classList.add(clase)
}

function capa(clase) {
  let el = document.querySelector(`.${clase}`)
  if (!el) {
    el = document.createElement('div')
    el.className = clase
    el.setAttribute('aria-hidden', 'true')
    document.body.appendChild(el)
  }
  return el
}

function mostrarRacha() {
  if (racha < 2) { insignia?.remove(); insignia = null; return }
  if (!insignia || !insignia.isConnected) {
    insignia = document.createElement('div')
    insignia.className = 'fx-racha'
    insignia.setAttribute('aria-hidden', 'true')
    document.body.appendChild(insignia)
  }
  insignia.textContent = `🔥 Racha x${racha}`
  animar(insignia, 'fx-racha-pop')
  clearTimeout(rachaTimer)
  rachaTimer = setTimeout(() => { insignia?.remove(); insignia = null }, 3500)
}

// Se llama desde sonar(): mismo tipo de evento, mismo momento.
export function alSonido(tipo) {
  if (typeof document === 'undefined') return
  if (tipo === 'ok') {
    racha++
    estallido()
    animar(capa('fx-destello'), 'fx-activo')
    mostrarRacha()
  } else if (tipo === 'error') {
    racha = 0
    mostrarRacha()
    animar(document.querySelector('.pantalla'), 'fx-sacudir')
    animar(capa('fx-vineta'), 'fx-activo')
  } else if (tipo === 'pista') {
    estallido(undefined, undefined, COLORES_PISTA, 8)
  } else if (tipo === 'victoria') {
    lucesDeEscenario()
  }
}

// El estallido sale del elemento tocado (botón, casilla, opción) o, si no, del punto de contacto.
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    const el = e.target.closest?.('button, [role=button], .opcion, .casilla, .letra, .celda')
    const r = el?.getBoundingClientRect()
    ultimo = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: e.clientX, y: e.clientY }
  }, { capture: true, passive: true })
  window.addEventListener('keydown', () => { ultimo = { x: window.innerWidth / 2, y: window.innerHeight / 2 } }, { passive: true })
}
