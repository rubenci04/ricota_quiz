import { useEffect, useRef } from 'react'
import { iniciarFondo } from './fondo.js'

// Canvas fijo detrás de toda la interfaz. Sin canvas cuando el interruptor está apagado.
export default function Fondo({ activo }) {
  const canvas = useRef(null)
  useEffect(() => {
    if (!activo || !canvas.current) return undefined
    return iniciarFondo(canvas.current)
  }, [activo])
  if (!activo) return null
  return <canvas ref={canvas} className="fondo-animado" aria-hidden="true" />
}
