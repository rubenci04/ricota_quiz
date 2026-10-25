import { useRef, useState } from 'react'
import { leer, sumarSopa } from './storage.js'
import Resultado from './Resultado.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'
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

const MAX_PISTAS = 5
const MAX_REVELAR = 1
const clave = (r, c) => `${r},${c}`

export default function SopaDeLetras({ onVolver }) {
  const [discoId, setDiscoId] = useState('todos')
  const [partida, setPartida] = useState(() => nuevaPartida('todos'))
  const [encontradas, setEncontradas] = useState({}) // norm -> índice de color
  const [seleccion, setSeleccion] = useState([])
  const gridRef = useRef(null)
  const inicio = useRef(null)
  const [pistas, setPistas] = useState([]) // norm de palabras con letra inicial revelada
  const [facil, setFacil] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [reveladas, setReveladas] = useState([]) // norm de palabras resaltadas completas

  const empezar = (id) => {
    setPartida(nuevaPartida(id))
    setEncontradas({})
    setSeleccion([])
    setPistas([])
    setReveladas([])
    setMensaje('')
  }

  const revelarPalabra = () => {
    const libres = partida.palabras.filter((p) => !(p.norm in encontradas) && !reveladas.includes(p.norm))
    if (reveladas.length >= MAX_REVELAR || libres.length === 0) return
    setReveladas([...reveladas, libres[Math.floor(Math.random() * libres.length)].norm])
    sonar('pista')
    setMensaje(`Palabra resaltada. ${frase('pista')}`)
  }

  const pedirPista = () => {
    const libres = partida.palabras.filter((p) => !(p.norm in encontradas) && !pistas.includes(p.norm))
    if (pistas.length >= MAX_PISTAS || libres.length === 0) return
    setPistas([...pistas, libres[Math.floor(Math.random() * libres.length)].norm])
    sonar('pista')
    setMensaje(`Pista: mirá la celda que destella. ${frase('pista')}`)
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
      if (Object.keys(encontradas).length + 1 === partida.palabras.length) sumarSopa(pistas.length === 0 && reveladas.length === 0)
      setEncontradas((prev) => ({ ...prev, [hallada.norm]: Object.keys(prev).length % COLORES.length }))
      sonar('ok')
      setMensaje(`✓ Encontraste «${hallada.original}». ${frase('acierto')}`)
    } else if (seleccion.length > 1) {
      sonar('error')
      setMensaje(`✗ Esa no es. ${frase('error')}`)
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
  // inicio de palabras con pista (destello) y palabras reveladas completas
  const destellos = new Set()
  const resaltadas = new Set()
  for (const p of partida.palabras) {
    if (p.norm in encontradas) continue
    if (pistas.includes(p.norm)) destellos.add(clave(p.r0, p.c0))
    if (reveladas.includes(p.norm)) {
      for (let i = 0; i < p.norm.length; i++) resaltadas.add(clave(p.r0 + p.dr * i, p.c0 + p.dc * i))
    }
  }
  const enSeleccion = new Set(seleccion.map(({ r, c }) => clave(r, c)))
  const ganaste = partida.palabras.length > 0 && Object.keys(encontradas).length === partida.palabras.length

  const disco = discos.find((d) => d.id === discoId)
  const tema = disco ? `${disco.titulo} (${disco.anio})` : 'todos los discos'

  return (
    <main className="pantalla juego">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Sopa de letras</h2>
      </header>

      <div className="tema">
        <p>Buscá palabras de: <strong>{tema}</strong></p>
        <p className="contador">Encontradas {Object.keys(encontradas).length} de {partida.palabras.length}</p>
      </div>

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
                className={`celda${enSeleccion.has(k) ? ' sel' : ''}${color ? ' hallada' : ''}${destellos.has(k) ? ' destello' : ''}${resaltadas.has(k) ? ' revelada' : ''}`}
                style={color ? { background: color } : undefined}
              >
                {letra}
              </div>
            )
          }),
        )}
      </div>

      <div className="casilleros">
        {partida.palabras.map((p) => {
          const hallada = p.norm in encontradas
          return (
            <div key={p.norm} className={`casillero${hallada ? ' tachada' : ''}`}>
              <b>{hallada ? p.original : '?'.repeat(p.norm.length)}</b>
              <small>
                de la canción «{p.cancion}» · {p.norm.length} letras
                {!hallada && pistas.includes(p.norm) && ` · empieza con ${p.norm[0]}`}
              </small>
            </div>
          )
        })}
      </div>

      <div className="herramientas">
        <button className="secundario" onClick={pedirPista} disabled={pistas.length >= MAX_PISTAS || ganaste}>
          Pista ({MAX_PISTAS - pistas.length})
        </button>
        <button className="secundario" onClick={revelarPalabra} disabled={reveladas.length >= MAX_REVELAR || ganaste}>
          Revelar palabra ({MAX_REVELAR - reveladas.length})
        </button>
        <label className="interruptor">
          <input type="checkbox" checked={facil} onChange={(e) => setFacil(e.target.checked)} />
          Modo fácil
        </label>
      </div>

      {facil && (
        <ul className="lista">
          {partida.palabras.map((p) => (
            <li key={p.norm} className={p.norm in encontradas ? 'tachada' : ''}>
              {p.original}
            </li>
          ))}
        </ul>
      )}

      <p className="feedback" role="status" aria-live="polite">{mensaje}</p>

      {ganaste && (
        <Resultado
          titulo="Sopa de letras"
          puntaje={`${partida.palabras.length}/${partida.palabras.length}`}
          detalle={`Pistas usadas: ${pistas.length}${reveladas.length ? ' · palabra revelada' : ''}`}
          mejor={{ etiqueta: 'Sopas completadas', valor: leer().sopas }}
          mensaje={frase('victoria')}
          compartir={`Completé una sopa de letras ricotera (${partida.palabras.length}/${partida.palabras.length}) 🎸 ¿Podés superarme?`}
        />
      )}

      <button className="nueva" onClick={() => empezar(discoId)}>Nueva partida</button>
    </main>
  )
}
