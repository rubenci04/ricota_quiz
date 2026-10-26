// Fondo animado en canvas: haces de luz de escenario, notas y partículas con paralaje suave.
// Solo formas y efectos originales. Un único requestAnimationFrame, pausado con la pestaña oculta.

const NOTAS = ['♪', '♫', '♩']
const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Paleta del juego, leída de las variables CSS (con valores de respaldo).
function paleta() {
  const css = getComputedStyle(document.documentElement)
  const leer = (n, d) => (/^#[0-9a-f]{6}$/i.test(css.getPropertyValue(n).trim()) ? css.getPropertyValue(n).trim() : d)
  return [leer('--acento', '#e0a526'), leer('--c-dicho', '#e11d48'), leer('--c-banda', '#7c5cff'), leer('--c-sopa', '#10b981')]
}

// Cantidad de partículas según la pantalla y los núcleos del dispositivo.
export function cantidadParticulas(ancho, alto, nucleos = navigator.hardwareConcurrency || 4) {
  const base = Math.min(36, Math.max(10, nucleos * 3))
  return Math.round(base * Math.min(1, (ancho * alto) / 900000))
}

export function iniciarFondo(canvas) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const colores = paleta()
  const estatico = reducido()
  let ancho = 0, alto = 0, dpr = 1, particulas = [], frame = 0, anterior = 0
  const puntero = { x: 0, y: 0 } // objetivo del paralaje, de -0.5 a 0.5
  const suave = { x: 0, y: 0 }
  const haces = [0.18, 0.5, 0.82].map((x, i) => ({ x, fase: i * 2.1, vel: 0.00018 + i * 0.00006, color: colores[i % colores.length] }))

  const ajustar = () => {
    dpr = Math.min(1.5, window.devicePixelRatio || 1)
    ancho = window.innerWidth
    alto = window.innerHeight
    canvas.width = Math.round(ancho * dpr)
    canvas.height = Math.round(alto * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const n = cantidadParticulas(ancho, alto)
    particulas = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * ancho, y: Math.random() * alto,
      prof: 0.3 + Math.random() * 0.9, // profundidad: más cerca, más paralaje y más velocidad
      tam: 8 + Math.random() * 14, vel: 6 + Math.random() * 14, fase: Math.random() * 6.28,
      nota: i % 3 === 0, glifo: NOTAS[i % NOTAS.length], color: colores[i % colores.length],
    }))
  }

  const dibujar = (t, dt) => {
    ctx.clearRect(0, 0, ancho, alto)
    suave.x += (puntero.x - suave.x) * 0.05
    suave.y += (puntero.y - suave.y) * 0.05
    ctx.globalCompositeOperation = 'lighter'
    for (const h of haces) {
      const ang = Math.sin(t * h.vel * 6.28 + h.fase) * 0.32 + (h.x - 0.5) * 0.5
      const x0 = h.x * ancho + suave.x * 40
      const largo = alto * 1.15
      const ancha = Math.max(60, ancho * 0.1)
      const x1 = x0 + Math.sin(ang) * largo
      const y1 = Math.cos(ang) * largo
      const g = ctx.createLinearGradient(x0, 0, x1, y1)
      g.addColorStop(0, h.color + '30')
      g.addColorStop(1, h.color + '00')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(x0 - 6, -4)
      ctx.lineTo(x0 + 6, -4)
      ctx.lineTo(x1 + ancha, y1)
      ctx.lineTo(x1 - ancha, y1)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
    for (const p of particulas) {
      p.y -= p.vel * p.prof * dt
      p.fase += dt * 0.8
      if (p.y < -30) { p.y = alto + 20; p.x = Math.random() * ancho }
      const x = p.x + Math.sin(p.fase) * 14 + suave.x * 60 * p.prof
      const y = p.y + suave.y * 40 * p.prof
      ctx.globalAlpha = 0.1 + 0.14 * p.prof
      ctx.fillStyle = p.color
      if (p.nota) {
        ctx.font = `${p.tam}px system-ui, sans-serif`
        ctx.fillText(p.glifo, x, y)
      } else {
        ctx.beginPath()
        ctx.arc(x, y, p.tam / 6, 0, 6.283)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  const bucle = (t) => {
    const dt = Math.min(0.05, (t - anterior) / 1000 || 0)
    anterior = t
    dibujar(t, dt)
    frame = requestAnimationFrame(bucle)
  }
  const arrancar = () => { cancelAnimationFrame(frame); anterior = performance.now(); frame = requestAnimationFrame(bucle) }
  const detener = () => cancelAnimationFrame(frame)

  const alVisibilidad = () => (document.hidden ? detener() : arrancar())
  const mover = (x, y) => { puntero.x = x / ancho - 0.5; puntero.y = y / alto - 0.5 }
  const alPuntero = (e) => mover(e.clientX, e.clientY)
  // giroscopio solo si está disponible sin pedir permisos (en iOS hay que pedirlos: no se usa)
  const alGiro = (e) => {
    if (e.gamma == null || e.beta == null) return
    puntero.x = Math.max(-0.5, Math.min(0.5, e.gamma / 60))
    puntero.y = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 90))
  }
  const giro = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission !== 'function'
  let redim
  const alRedimensionar = () => { clearTimeout(redim); redim = setTimeout(() => { ajustar(); if (estatico) dibujar(0, 0) }, 150) }

  ajustar()
  window.addEventListener('resize', alRedimensionar)
  if (estatico) {
    dibujar(0, 0) // fondo estático
  } else {
    window.addEventListener('pointermove', alPuntero, { passive: true })
    window.addEventListener('pointerdown', alPuntero, { passive: true })
    if (giro) window.addEventListener('deviceorientation', alGiro, { passive: true })
    document.addEventListener('visibilitychange', alVisibilidad)
    if (!document.hidden) arrancar()
  }
  return () => {
    detener()
    clearTimeout(redim)
    window.removeEventListener('resize', alRedimensionar)
    window.removeEventListener('pointermove', alPuntero)
    window.removeEventListener('pointerdown', alPuntero)
    window.removeEventListener('deviceorientation', alGiro)
    document.removeEventListener('visibilitychange', alVisibilidad)
  }
}
