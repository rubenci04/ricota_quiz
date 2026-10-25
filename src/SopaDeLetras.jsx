import { useRef, useState } from 'react'
import { leer, sumarSopa } from './storage.js'
import Resultado from './Resultado.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'
import { nuevaSemilla } from './desafio.js'
import SelectorTema from './SelectorTema.jsx'
import { nombreDeTema } from './temas.js'
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

export default function SopaDeLetras({ onVolver, desafio = null }) {
  // la semilla define la partida: con la misma semilla y disco sale la misma sopa
  const inicial = useRef(null)
  if (!inicial.current) {
    const semilla = desafio ? desafio.semilla : nuevaSemilla()
    const disco = desafio ? desafio.disco : 'todos'
    const tema = desafio ? desafio.tema : 'todos'
    inicial.current = { semilla, disco, tema, partida: nuevaPartida(disco, semilla, tema) }
  }
  const [semilla, setSemilla] = useState(inicial.current.semilla)
  const [discoId, setDiscoId] = useState(inicial.current.disco)
  const [temaId, setTemaId] = useState(inicial.current.tema)
  const [partida, setPartida] = useState(inicial.current.partida)
  const [encontradas, setEncontradas] = useState({}) // norm -> índice de color
  const [seleccion, setSeleccion] = useState([])
  const gridRef = useRef(null)
  const inicio = useRef(null)
  const inicioTeclado = useRef(null) // celda donde se marcó el inicio con el teclado
  const [cursor, setCursor] = useState(null) // celda del cursor de teclado
  const [pistas, setPistas] = useState([]) // norm de palabras con letra inicial revelada
  const [facil, setFacil] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [reveladas, setReveladas] = useState([]) // norm de palabras resaltadas completas

  const empezar = (id, t = temaId) => {
    const sem = nuevaSemilla()
    setSemilla(sem)
    setPartida(nuevaPartida(id, sem, t))
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

  const cambiarTema = (t) => {
    setTemaId(t)
    empezar(discoId, t)
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

  // evalúa una selección (la hecha con puntero o con teclado)
  const confirmarSeleccion = (cels) => {
    const letras = cels.map(({ r, c }) => partida.grilla[r][c]).join('')
    const alReves = [...letras].reverse().join('')
    const hallada = partida.palabras.find(
      (p) => !(p.norm in encontradas) && (p.norm === letras || p.norm === alReves),
    )
    if (hallada) {
      if (Object.keys(encontradas).length + 1 === partida.palabras.length) sumarSopa(pistas.length === 0 && reveladas.length === 0)
      setEncontradas((prev) => ({ ...prev, [hallada.norm]: Object.keys(prev).length % COLORES.length }))
      sonar('ok')
      setMensaje(`✓ Encontraste «${hallada.original}». ${frase('acierto')}`)
    } else if (cels.length > 1) {
      sonar('error')
      setMensaje(`✗ Esa no es. ${frase('error')}`)
    }
    setSeleccion([])
  }

  const alSoltar = () => {
    if (!inicio.current) return
    inicio.current = null
    confirmarSeleccion(seleccion)
  }

  // Teclado: flechas para moverse, Enter (o espacio) para marcar el inicio y el final, Escape para cancelar.
  const alTeclaGrilla = (e) => {
    if (ganaste) return
    const mov = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key]
    if (mov) {
      e.preventDefault()
      const base = cursor || { r: 0, c: 0 }
      const r = Math.min(SIZE - 1, Math.max(0, base.r + (cursor ? mov[0] : 0)))
      const c = Math.min(SIZE - 1, Math.max(0, base.c + (cursor ? mov[1] : 0)))
      setCursor({ r, c })
      if (inicioTeclado.current) setSeleccion(lineaHasta(inicioTeclado.current, r, c))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const actual = cursor || { r: 0, c: 0 }
      setCursor(actual)
      if (!inicioTeclado.current) {
        inicioTeclado.current = actual
        setSeleccion([actual])
        setMensaje(`Inicio marcado en fila ${actual.r + 1}, columna ${actual.c + 1}. Movete y apretá Enter para marcar el final.`)
      } else {
        const cels = lineaHasta(inicioTeclado.current, actual.r, actual.c)
        inicioTeclado.current = null
        confirmarSeleccion(cels)
      }
    } else if (e.key === 'Escape' && inicioTeclado.current) {
      e.preventDefault()
      inicioTeclado.current = null
      setSeleccion([])
      setMensaje('Selección cancelada.')
    }
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
        <p>Buscá palabras de: <strong>{tema}{temaId !== 'todos' ? ` · ${nombreDeTema(temaId)}` : ''}</strong></p>
        <p className="contador">Encontradas {Object.keys(encontradas).length} de {partida.palabras.length}</p>
      </div>

      <label className="selector">
        <span>Disco</span>
        <select value={discoId} disabled={!!desafio} onChange={(e) => cambiarDisco(e.target.value)}>
          <option value="todos">Todos</option>
          {discos.map((d) => (
            <option key={d.id} value={d.id} disabled={!discoTieneJuego(d.id, temaId)}>
              {d.titulo} ({d.anio}){discoTieneJuego(d.id, temaId) ? '' : ' – sin palabras aún'}
            </option>
          ))}
        </select>
      </label>

      <SelectorTema valor={temaId} onCambio={cambiarTema} tieneDatos={(t) => discoTieneJuego(discoId, t)} deshabilitado={!!desafio} />

      <div
        className="grilla"
        ref={gridRef}
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        tabIndex={0}
        role="application"
        aria-label="Sopa de letras. Usá las flechas para moverte y Enter para marcar el inicio y el final de una palabra. Escape cancela."
        onKeyDown={alTeclaGrilla}
        onFocus={() => setCursor((c) => c || { r: 0, c: 0 })}
      >
        {partida.grilla.map((fila, r) =>
          fila.map((letra, c) => {
            const k = clave(r, c)
            const color = marcadas.get(k)
            return (
              <div
                key={k}
                className={`celda${cursor && cursor.r === r && cursor.c === c ? ' cursor-teclado' : ''}${enSeleccion.has(k) ? ' sel' : ''}${color ? ' hallada' : ''}${destellos.has(k) ? ' destello' : ''}${resaltadas.has(k) ? ' revelada' : ''}`}
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
          puntaje={`${Math.max(0, 100 - 10 * pistas.length - 25 * reveladas.length)} pts`}
          detalle={`${partida.palabras.length}/${partida.palabras.length} palabras · pistas usadas: ${pistas.length}${reveladas.length ? ' · palabra revelada' : ''}`}
          mejor={{ etiqueta: 'Sopas completadas', valor: leer().sopas }}
          desafio={{ modo: 'sopa', disco: discoId, tema: temaId, dif: 'casual', semilla, puntaje: Math.max(0, 100 - 10 * pistas.length - 25 * reveladas.length) }}
          rival={desafio ? { puntaje: desafio.puntaje } : null}
          mensaje={frase('victoria')}
          compartir={`Completé una sopa de letras ricotera (${partida.palabras.length}/${partida.palabras.length}) 🎸 ¿Podés superarme?`}
        />
      )}

      {desafio ? (
        <button className="nueva" onClick={onVolver}>Volver al menú</button>
      ) : (
        <button className="nueva" onClick={() => empezar(discoId)}>Nueva partida</button>
      )}
    </main>
  )
}
