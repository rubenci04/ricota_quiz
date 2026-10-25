import { useRef, useState } from 'react'
import datos from './data/datos-ricotero.json'
import { normalizar } from './sopa.js'
import { hayCrucigrama, nuevoCrucigrama } from './crucigrama.js'
import Confeti from './Confeti.jsx'
import { sonar } from './sonido.js'

const MAX_PISTAS = 5
const MAX_PALABRAS = 2
const VECTOR = { across: [0, 1], down: [1, 0] }

// si un intento no logra armar el tablero, se prueba con otras semillas antes de rendirse
function generar(id, dif) {
  for (let i = 0; i < 3; i++) {
    const j = nuevoCrucigrama(id, dif)
    if (j) return j
  }
  return null
}

export default function Crucigrama({ onVolver }) {
  const [discoId, setDiscoId] = useState('todos')
  const [dificultad, setDificultad] = useState('casual')
  const [juego, setJuego] = useState(() => generar('todos', 'casual'))
  const [letras, setLetras] = useState({})
  const [fijas, setFijas] = useState({})
  const [revision, setRevision] = useState({})
  const [sel, setSel] = useState(null) // { r, c, dir }
  const [pistas, setPistas] = useState(0)
  const [palabrasReveladas, setPalabrasReveladas] = useState(0)
  const [mensaje, setMensaje] = useState('')
  const entrada = useRef(null)

  const empezar = (id, dif = dificultad) => {
    setJuego(generar(id, dif))
    setMensaje('')
    setLetras({}); setFijas({}); setRevision({}); setSel(null); setPistas(0); setPalabrasReveladas(0)
  }

  const cambiarDisco = (id) => {
    setDiscoId(id)
    empezar(id)
  }

  if (!juego) {
    return (
      <main className="pantalla">
        <p>No se pudo armar un crucigrama con estos datos.</p>
        <button className="nueva" onClick={() => cambiarDisco('todos')}>Probar con todos los discos</button>
        <button className="secundario" onClick={onVolver}>Volver</button>
      </main>
    )
  }

  const { filas, cols, entradas, solucion, numeros } = juego
  const enEntrada = (e, r, c) => {
    const [dr, dc] = VECTOR[e.dir]
    const i = dr ? r - e.r : c - e.c
    return (dr ? c === e.c : r === e.r) && i >= 0 && i < e.respuesta.length
  }
  const entradaEn = (r, c, dir) => entradas.find((e) => e.dir === dir && enEntrada(e, r, c))
  const activa = sel ? entradaEn(sel.r, sel.c, sel.dir) : null

  const tocar = (r, c) => {
    const a = entradaEn(r, c, 'across')
    const d = entradaEn(r, c, 'down')
    if (!a && !d) return
    let dir
    if (sel && sel.r === r && sel.c === c && a && d) dir = sel.dir === 'across' ? 'down' : 'across'
    else if (sel && ((sel.dir === 'across' && a) || (sel.dir === 'down' && d))) dir = sel.dir
    else dir = a ? 'across' : 'down'
    setSel({ r, c, dir })
    entrada.current?.focus()
  }

  const tocarPista = (e) => {
    setSel({ r: e.r, c: e.c, dir: e.dir })
    entrada.current?.focus()
  }

  const ponerLetra = (ch) => {
    if (!sel || ganaste) return
    const k = `${sel.r},${sel.c}`
    if (fijas[k]) return avanzar(1)
    setLetras((prev) => ({ ...prev, [k]: ch }))
    setRevision((prev) => { const n = { ...prev }; delete n[k]; return n })
    avanzar(1)
  }

  const avanzar = (paso) => {
    if (!sel || !activa) return
    const [dr, dc] = VECTOR[sel.dir]
    const r = sel.r + dr * paso
    const c = sel.c + dc * paso
    if (enEntrada(activa, r, c)) setSel({ ...sel, r, c })
  }

  const borrar = () => {
    if (!sel || ganaste) return
    const k = `${sel.r},${sel.c}`
    if (letras[k] && !fijas[k]) {
      setLetras((prev) => { const n = { ...prev }; delete n[k]; return n })
      setRevision((prev) => { const n = { ...prev }; delete n[k]; return n })
    } else {
      avanzar(-1)
    }
  }

  const alEscribir = (e) => {
    for (const ch of e.target.value) {
      const n = normalizar(ch)
      if (/^[A-Z]$/.test(n)) ponerLetra(n)
    }
  }

  const comprobar = () => {
    const res = {}
    for (const [k, v] of Object.entries(letras)) res[k] = v === solucion[k] ? 'ok' : 'mal'
    setRevision(res)
    const buenas = Object.values(res).filter((x) => x === 'ok').length
    const malas = Object.values(res).filter((x) => x === 'mal').length
    setMensaje(`✓ ${buenas} ${buenas === 1 ? 'letra correcta' : 'letras correctas'} · ✗ ${malas} ${malas === 1 ? 'incorrecta' : 'incorrectas'}`)
    if (malas) sonar('error')
    else if (buenas) sonar('ok')
  }

  const revelarPalabra = () => {
    if (!activa || palabrasReveladas >= MAX_PALABRAS || ganaste) return
    const [dr, dc] = VECTOR[activa.dir]
    const celdas = Array.from({ length: activa.respuesta.length }, (_, i) => `${activa.r + dr * i},${activa.c + dc * i}`)
    setLetras((prev) => ({ ...prev, ...Object.fromEntries(celdas.map((k) => [k, solucion[k]])) }))
    setFijas((prev) => ({ ...prev, ...Object.fromEntries(celdas.map((k) => [k, true])) }))
    setRevision((prev) => { const n = { ...prev }; celdas.forEach((k) => delete n[k]); return n })
    setPalabrasReveladas(palabrasReveladas + 1)
  }

  const pedirPista = () => {
    if (pistas >= MAX_PISTAS || ganaste) return
    let k = sel && letras[`${sel.r},${sel.c}`] !== solucion[`${sel.r},${sel.c}`] ? `${sel.r},${sel.c}` : null
    if (!k) {
      const faltan = Object.keys(solucion).filter((x) => letras[x] !== solucion[x])
      if (!faltan.length) return
      k = faltan[Math.floor(Math.random() * faltan.length)]
    }
    setLetras((prev) => ({ ...prev, [k]: solucion[k] }))
    setFijas((prev) => ({ ...prev, [k]: true }))
    setRevision((prev) => { const n = { ...prev }; delete n[k]; return n })
    setPistas(pistas + 1)
  }

  const ganaste = Object.keys(solucion).every((k) => letras[k] === solucion[k])
  const lado = Math.max(filas, cols)
  const horizontales = entradas.filter((e) => e.dir === 'across').sort((a, b) => a.num - b.num)
  const verticales = entradas.filter((e) => e.dir === 'down').sort((a, b) => a.num - b.num)

  const lista = (titulo, items) => (
    <section className="pistas-grupo">
      <h3>{titulo}</h3>
      {items.map((e) => (
        <button
          key={`${e.dir}${e.num}`}
          className={`pista-item${activa === e ? ' activa' : ''}`}
          onClick={() => tocarPista(e)}
        >
          <b>{e.num}.</b> {e.pista}
        </button>
      ))}
    </section>
  )

  return (
    <main className="pantalla juego">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Crucigrama</h2>
      </header>

      <label className="selector">
        <span>Tema</span>
        <select value={discoId} onChange={(e) => cambiarDisco(e.target.value)}>
          <option value="todos">Todos</option>
          {datos.discos.map((d) => (
            <option key={d.id} value={d.id} disabled={!hayCrucigrama(d.id)}>
              {d.titulo} ({d.anio}){hayCrucigrama(d.id) ? '' : ' – pocos datos'}
            </option>
          ))}
        </select>
      </label>

      <label className="selector">
        <span>Nivel</span>
        <select
          value={dificultad}
          onChange={(e) => { setDificultad(e.target.value); empezar(discoId, e.target.value) }}
        >
          <option value="casual">Casual (con la canción en la pista)</option>
          <option value="fanatico">Fanático (solo la definición)</option>
        </select>
      </label>

      <div className="pista-actual">
        {activa ? <><b>{activa.num} {activa.dir === 'across' ? '→' : '↓'}</b> {activa.pista}</> : 'Tocá una celda para empezar'}
      </div>

      <div
        className="cruci"
        style={{
          width: `calc(var(--ancho) * ${cols} / ${lado})`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${filas}, 1fr)`,
          aspectRatio: `${cols} / ${filas}`,
          '--celda': `calc(var(--ancho) / ${lado})`,
        }}
      >
        {Array.from({ length: filas * cols }, (_, i) => {
          const r = Math.floor(i / cols)
          const c = i % cols
          const k = `${r},${c}`
          if (!(k in solucion)) return <div key={k} className="bloque" />
          const clases = ['letra']
          if (activa && enEntrada(activa, r, c)) clases.push('en-activa')
          if (sel && sel.r === r && sel.c === c) clases.push('actual')
          if (revision[k]) clases.push(revision[k])
          if (fijas[k]) clases.push('fija')
          return (
            <div
              key={k}
              className={clases.join(' ')}
              onPointerDown={() => tocar(r, c)}
              role="button"
              aria-label={`Celda ${numeros[k] ? 'número ' + numeros[k] + ', ' : ''}fila ${r + 1}, columna ${c + 1}: ${letras[k] || 'vacía'}${revision[k] === 'ok' ? ', correcta' : revision[k] === 'mal' ? ', incorrecta' : ''}`}
            >
              {numeros[k] && <small>{numeros[k]}</small>}
              {letras[k] || ''}
            </div>
          )
        })}
      </div>

      <input
        ref={entrada}
        className="oculto"
        value=""
        onChange={alEscribir}
        onKeyDown={(e) => { if (e.key === 'Backspace') { e.preventDefault(); borrar() } }}
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        aria-label="Escribir letra"
      />

      {ganaste && <Confeti />}
      {ganaste && <div className="victoria" role="status"><strong>¡Completaste el crucigrama!</strong> Zafaste.</div>}

      <p className="feedback" role="status" aria-live="polite">{ganaste ? '✓ ¡Completaste el crucigrama!' : mensaje}</p>

      <div className="herramientas">
        <button className="secundario" onClick={comprobar}>Comprobar</button>
        <button className="secundario" onClick={borrar} aria-label="Borrar letra">⌫</button>
      </div>
      <div className="herramientas">
        <button className="secundario" onClick={pedirPista} disabled={pistas >= MAX_PISTAS || ganaste}>
          Revelar letra ({MAX_PISTAS - pistas})
        </button>
        <button
          className="secundario"
          onClick={revelarPalabra}
          disabled={!activa || palabrasReveladas >= MAX_PALABRAS || ganaste}
        >
          Revelar palabra ({MAX_PALABRAS - palabrasReveladas})
        </button>
      </div>

      {lista('Horizontales', horizontales)}
      {lista('Verticales', verticales)}

      <button className="nueva" onClick={() => empezar(discoId)}>Nuevo crucigrama</button>
    </main>
  )
}
