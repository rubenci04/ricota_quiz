import { useEffect, useRef, useState } from 'react'

const reducido = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Número que sube hasta su valor (ej. "7/10", "+3", "82 pts"): anima el primer entero del texto.
export function Contador({ valor, duracion = 700 }) {
  const texto = String(valor)
  const m = /\d+/.exec(texto)
  const meta = m ? Number(m[0]) : 0
  const [actual, setActual] = useState(() => (!m || reducido() ? meta : 0))
  const sigue = useRef(null)
  useEffect(() => {
    if (!m || reducido()) { setActual(meta); return undefined }
    const inicio = performance.now()
    const paso = (t) => {
      const e = Math.min(1, (t - inicio) / duracion)
      setActual(Math.round(meta * (1 - (1 - e) ** 3)))
      if (e < 1) sigue.current = requestAnimationFrame(paso)
    }
    sigue.current = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(sigue.current)
  }, [texto]) // eslint-disable-line react-hooks/exhaustive-deps
  return m ? `${texto.slice(0, m.index)}${actual}${texto.slice(m.index + m[0].length)}` : texto
}

// Barra de progreso con transición suave.
export function Barra({ valor, max, etiqueta }) {
  const pct = max > 0 ? Math.min(100, Math.round((100 * valor) / max)) : 0
  return (
    <div className="barra-progreso" role="progressbar" aria-label={etiqueta} aria-valuemin={0} aria-valuemax={max} aria-valuenow={valor}>
      <span style={{ width: `${pct}%` }} />
    </div>
  )
}
