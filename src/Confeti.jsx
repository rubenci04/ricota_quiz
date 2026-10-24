import { useEffect, useRef } from 'react'
import { sonar } from './sonido.js'

const COLORES = ['#e0a526', '#c0392b', '#3aa17e', '#5b8def', '#b455d6', '#e8e4da']

// Celebración al ganar: confeti en canvas + sonido de victoria.
export default function Confeti() {
  const canvas = useRef(null)

  useEffect(() => {
    sonar('victoria')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    cv.width = window.innerWidth
    cv.height = window.innerHeight
    const piezas = Array.from({ length: 120 }, () => ({
      x: Math.random() * cv.width,
      y: -20 - Math.random() * cv.height * 0.5,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      giro: Math.random() * Math.PI,
      vgiro: (Math.random() - 0.5) * 0.3,
      tam: 6 + Math.random() * 6,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
    }))
    let frame
    const inicio = performance.now()
    const dibujar = (t) => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      for (const p of piezas) {
        p.x += p.vx
        p.y += p.vy
        p.giro += p.vgiro
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.giro)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2)
        ctx.restore()
      }
      if (t - inicio < 3500) frame = requestAnimationFrame(dibujar)
      else ctx.clearRect(0, 0, cv.width, cv.height)
    }
    frame = requestAnimationFrame(dibujar)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={canvas} className="confeti" aria-hidden="true" />
}
