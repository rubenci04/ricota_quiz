import { useRef, useState } from 'react'
import { SIZE, discos, discoTieneJuego, nuevaPartida } from './sopa.js'

const COLORES = ['#e0a526', '#c0392b', '#3aa17e', '#5b8def', '#b455d6', '#e0742b', '#2bb7c9', '#d6567f', '#8fb339', '#9a8cff']
const DIRECCIONES = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]

// Línea recta (8 direcciones) desde el inicio hacia la celda bajo el dedo.
function lineaHasta(ini, r, c) {
  const dr = r - ini.r
  const dc = c - ini.c
  if (dr === 0 && dc === 0) return [ini]
  const octante = (Math.round(Math.atan2(dr, dc) / (Math.PI / 4)) + 8) % 8
  const [ddr, ddc] = DIRECCIONES[octante]
  const diagonal = ddr !== 0 && ddc !== 0
  let largo = Math.round(Math.hypot(dr, dc) / (diagonal ? Math.SQRT2 : 1)) + 1
  while (largo > 1) {
    const rf = ini.r + ddr * (largo - 1)
    const cf = ini.c + ddc * (largo - 1)
    if (rf >= 0 && rf < SIZE && cf >= 0 && cf < SIZE) break
    largo--
  }
  return Array.from({ length: largo }, (_, i) => ({ r: ini.r + ddr * i, c: ini.c + ddc * i }))
}

const clave = (r, c) => `${r},${c}`

export default function SopaDeLetras({ onVolver }) {
  const [discoId, setDiscoId] = useState('todos')
  const [partida, setPartida] = useState(() => nuevaPartida('todos'))
  const [encontradas, setEncontradas] = useState({}) // norm -> índice de color
  const [seleccion, setSeleccion] = useState([])
  const gridRef = useRef(null)
  const inicio = useRef(null)

  const empezar = (id) => {
    setPartida(nuevaPartida(id))
    setEncontradas({})
    setSeleccion([])
  }

  const cambiarDisco = (id) => {
    setDiscoId(id)
    empezar(id)
  }

  const celdaDesde = (e) => {
    const rect = gridRef.current.getBoundingClientRect()
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE)
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE)
    return {
      r: Math.min(SIZE - 1, Math.max(0, r)),
      c: Math.min(SIZE - 1, Math.max(0, c)),
    }
  }

  const alPresionar = (e) => {
    if (ganaste) return
    e.currentTarget.setPointerCapture(e.pointerId)
    inicio.current = celdaDesde(e)
    setSeleccion([inicio.current])
  }

  const alMover = (e) => {
    if (!inicio.current) return
    const { r, c } = celdaDesde(e)
    setSeleccion(lineaHasta(inicio.current, r, c))
  }

  const alSoltar = () => {
    if (!inicio.current) return
    inicio.current = null
    const letras = seleccion.map(({ r, c }) => partida.grilla[r][c]).join('')
    const alReves = [...letras].reverse().join('')
    const hallada = partida.palabras.find(
      (p) => !(p.norm in encontradas) && (p.norm === letras || p.norm === alReves),
    )
    if (hallada) {
      setEncontradas((prev) => ({ ...prev, [hallada.norm]: Object.keys(prev).length % COLORES.length }))
    }
    setSeleccion([])
  }

  // celdas marcadas de palabras ya encontradas
  const marcadas = new Map()
  for (const p of partida.palabras) {
    if (!(p.norm in encontradas)) continue
    for (let i = 0; i < p.norm.length; i++) {
      marcadas.set(clave(p.r0 + p.dr * i, p.c0 + p.dc * i), COLORES[encontradas[p.norm]])
    }
  }
  const enSeleccion = new Set(seleccion.map(({ r, c }) => clave(r, c)))
  const ganaste = partida.palabras.length > 0 && Object.keys(encontradas).length === partida.palabras.length

  return (
    <main className="pantalla juego">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Sopa de letras</h2>
        <span className="contador">{Object.keys(encontradas).length}/{partida.palabras.length}</span>
      </header>

      <label className="selector">
        <span>Disco</span>
        <select value={discoId} onChange={(e) => cambiarDisco(e.target.value)}>
          <option value="todos">Todos</option>
          {discos.map((d) => (
            <option key={d.id} value={d.id} disabled={!discoTieneJuego(d.id)}>
              {d.titulo} ({d.anio}){discoTieneJuego(d.id) ? '' : ' – sin palabras aún'}
            </option>
          ))}
        </select>
      </label>

      <div
        className="grilla"
        ref={gridRef}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        {partida.grilla.map((fila, r) =>
          fila.map((letra, c) => {
            const k = clave(r, c)
            const color = marcadas.get(k)
            return (
              <div
                key={k}
                className={`celda${enSeleccion.has(k) ? ' sel' : ''}${color ? ' hallada' : ''}`}
                style={color ? { background: color } : undefined}
              >
                {letra}
              </div>
            )
          }),
        )}
      </div>

      <ul className="lista">
        {partida.palabras.map((p) => (
          <li key={p.norm} className={p.norm in encontradas ? 'tachada' : ''}>
            {p.original}
          </li>
        ))}
      </ul>

      {ganaste && (
        <div className="victoria" role="status">
          <strong>¡Ganaste!</strong> Encontraste todas las palabras. ¡Que viva el Indio!
        </div>
      )}

      <button className="nueva" onClick={() => empezar(discoId)}>Nueva partida</button>
    </main>
  )
}
