import { useEffect, useRef, useState } from 'react'
import { textoSobre } from './contraste.js'
import { sonar } from './sonido.js'

const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const entero = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n

// Ruleta estilo concurso: la porción ganadora se sortea antes de girar y el disco frena justo ahí.
// etiquetas: [{ texto, icono, color }]. Con autoGirar gira sola (por ejemplo, el turno de la CPU).
export default function Ruleta({ etiquetas, onResultado, textoBoton = '¡Girar!', autoGirar = false, titulo, deshabilitada = false }) {
  const n = etiquetas.length
  const [giro, setGiro] = useState(0)
  const [estado, setEstado] = useState('quieta') // quieta | girando | lista
  const [ganadora, setGanadora] = useState(null)
  const fin = useRef(null)
  const aviso = useRef(onResultado)
  aviso.current = onResultado
  const paso = 360 / n
  const sinMovimiento = reducido()

  const terminar = (idx) => {
    clearTimeout(fin.current)
    setEstado('lista')
    sonar('caida')
    aviso.current(idx)
  }

  const girar = () => {
    if (estado !== 'quieta' || deshabilitada) return
    const idx = entero(n)
    const centro = idx * paso + paso / 2 + (Math.random() - 0.5) * paso * 0.6
    const base = Math.ceil(giro / 360) * 360
    setGanadora(idx)
    setGiro(base + 360 * (sinMovimiento ? 0 : 5) + (360 - centro))
    setEstado('girando')
    sonar('giro')
    fin.current = setTimeout(() => terminar(idx), sinMovimiento ? 500 : 4600)
  }

  useEffect(() => () => clearTimeout(fin.current), [])
  useEffect(() => {
    if (!autoGirar || estado !== 'quieta') return undefined
    const t = setTimeout(girar, 700)
    return () => clearTimeout(t)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const fondo = `conic-gradient(${etiquetas.map((e, i) => `${e.color} ${i * paso}deg ${(i + 1) * paso}deg`).join(', ')})`
  return (
    <div className="rt" aria-label={titulo}>
      <div className="rt-escena">
        <span className={`rt-puntero${estado === 'girando' ? ' tic' : ''}`} aria-hidden="true">▼</span>
        <div
          className={`rt-disco${estado === 'girando' ? ' girando' : ''}`}
          style={{ background: fondo, transform: `rotate(${giro}deg)`, transitionDuration: sinMovimiento ? '0.3s' : '4.4s' }}
          aria-hidden="true"
        >
          {etiquetas.map((e, i) => (
            <span
              key={i}
              className={`rt-seg${estado === 'lista' && ganadora === i ? ' gana' : ''}`}
              style={{ transform: `rotate(${i * paso + paso / 2}deg) translateY(calc(var(--rt) * -0.43))`, color: textoSobre(e.color) }}
            >
              <b>{e.icono}</b>
              <small>{e.texto}</small>
            </span>
          ))}
        </div>
        <span className="rt-centro" aria-hidden="true">🎸</span>
      </div>
      {!autoGirar && (
        <button className="nueva rt-boton" onClick={girar} disabled={estado !== 'quieta' || deshabilitada}>
          {estado === 'girando' ? 'Girando…' : textoBoton}
        </button>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {estado === 'lista' && ganadora !== null ? `Salió: ${etiquetas[ganadora].texto}` : ''}
      </p>
    </div>
  )
}
