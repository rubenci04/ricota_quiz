import { useEffect, useRef, useState } from 'react'
import Cabecera from './Cabecera.jsx'
import datos from './data/datos-ricotero.json'
import { normalizar } from './sopa.js'
import { hayCrucigrama, nuevoCrucigrama } from './crucigrama.js'
import Resultado from './Resultado.jsx'
import { sonar } from './sonido.js'
import { guardar, leer } from './storage.js'
import { frase } from './textos.js'
import { nuevaSemilla } from './desafio.js'
import SelectorDisco from './SelectorDisco.jsx'

const MAX_PISTAS = 7 // incluye 2 extra
const ERRORES_PARA_PISTA = 2
const MAX_PALABRAS = 2
const VECTOR = { across: [0, 1], down: [1, 0] }

// si un intento no logra armar el tablero, se prueba con otras semillas antes de rendirse
// (con la misma semilla, tema y dificultad sale siempre el mismo tablero)
function generar(id, dif, semilla, tema = 'todos') {
  for (let i = 0; i < 3; i++) {
    const j = nuevoCrucigrama(id, dif, i === 0 ? semilla : `${semilla}-${i}`, tema)
    if (j) return j
  }
  return null
}

export default function Crucigrama({ onVolver, onMenu, desafio = null }) {
  const inicial = useRef(null)
  if (!inicial.current) {
    const semilla = desafio ? desafio.semilla : nuevaSemilla()
    const disco = desafio ? desafio.disco : 'todos'
    const tema = desafio ? desafio.tema : 'todos'
    const dif = desafio ? desafio.dif : leer().dificultad
    inicial.current = { semilla, disco, tema, dif, juego: generar(disco, dif, semilla, tema) }
  }
  const [semilla, setSemilla] = useState(inicial.current.semilla)
  const [discoId, setDiscoId] = useState(inicial.current.disco)
  const [temaId, setTemaId] = useState(inicial.current.tema)
  const [dificultad, setDificultad] = useState(inicial.current.dif)
  const [juego, setJuego] = useState(inicial.current.juego)
  const [letras, setLetras] = useState({})
  const [fijas, setFijas] = useState({})
  const [revision, setRevision] = useState({})
  const [sel, setSel] = useState(null) // { r, c, dir }
  const [pistas, setPistas] = useState(0)
  const [palabrasReveladas, setPalabrasReveladas] = useState(0)
  const [mensaje, setMensaje] = useState('')
  const [erroresSeguidos, setErroresSeguidos] = useState(0)
  const [completados, setCompletados] = useState(() => leer().crucigramas)
  const entrada = useRef(null)
  const celdas = useRef({}) // referencias a las celdas, para moverles el foco con el teclado
  const porTeclado = useRef(false)

  // si se navega con el teclado, el foco acompaña a la celda seleccionada
  useEffect(() => {
    if (porTeclado.current && sel) celdas.current[`${sel.r},${sel.c}`]?.focus()
  }, [sel])

  const empezar = (id, dif = dificultad, t = temaId) => {
    const sem = nuevaSemilla()
    setSemilla(sem)
    setJuego(generar(id, dif, sem, t))
    setMensaje('')
    setErroresSeguidos(0)
    setLetras({}); setFijas({}); setRevision({}); setSel(null); setPistas(0); setPalabrasReveladas(0)
  }

  const cambiarTema = (t) => {
    setTemaId(t)
    empezar(discoId, dificultad, t)
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
    porTeclado.current = false
    setSel({ r, c, dir })
    entrada.current?.focus()
  }

  // sin tocar el campo oculto: la usa la navegación con teclado
  const seleccionarCelda = (r, c, preferida) => {
    const a = entradaEn(r, c, 'across')
    const d = entradaEn(r, c, 'down')
    if (!a && !d) return
    const dir = preferida === 'across' && a ? 'across' : preferida === 'down' && d ? 'down' : a ? 'across' : 'down'
    setSel({ r, c, dir })
  }

  const moverA = (r, c, dr, dc, preferida) => {
    for (let k = 1; k <= Math.max(filas, cols); k++) {
      const nr = r + dr * k
      const nc = c + dc * k
      if (nr < 0 || nc < 0 || nr >= filas || nc >= cols) return
      if (`${nr},${nc}` in solucion) return seleccionarCelda(nr, nc, preferida)
    }
  }

  const alTeclaCelda = (e, r, c) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const mov = { ArrowUp: [-1, 0, 'down'], ArrowDown: [1, 0, 'down'], ArrowLeft: [0, -1, 'across'], ArrowRight: [0, 1, 'across'] }[e.key]
    if (mov) {
      e.preventDefault()
      porTeclado.current = true
      moverA(r, c, mov[0], mov[1], mov[2])
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      porTeclado.current = true
      borrar()
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      porTeclado.current = true
      // sobre la celda ya seleccionada alterna la dirección
      if (sel && sel.r === r && sel.c === c) tocar(r, c)
      else seleccionarCelda(r, c, sel?.dir)
    } else if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
      e.preventDefault()
      porTeclado.current = true
      const n = normalizar(e.key)
      if (/^[A-Z]$/.test(n)) ponerLetra(n)
    }
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
    let texto = `✓ ${buenas} ${buenas === 1 ? 'letra correcta' : 'letras correctas'} · ✗ ${malas} ${malas === 1 ? 'incorrecta' : 'incorrectas'}. ${frase(malas ? 'error' : 'acierto')}`
    if (malas) sonar('error')
    else if (buenas) sonar('ok')
    // pista automática tras 2 comprobaciones con errores seguidas: una letra gratis (no cuenta como pista)
    const seguidos = malas ? erroresSeguidos + 1 : 0
    if (seguidos >= ERRORES_PARA_PISTA) {
      const faltan = Object.keys(solucion).filter((x) => letras[x] !== solucion[x])
      if (faltan.length) {
        const k = faltan[Math.floor(Math.random() * faltan.length)]
        setLetras((prev) => ({ ...prev, [k]: solucion[k] }))
        setFijas((prev) => ({ ...prev, [k]: true }))
        setRevision((prev) => { const n = { ...prev }; delete n[k]; return n })
        sonar('pista')
        texto += ' Te regalo una letra para que sigas.'
      }
      setErroresSeguidos(0)
    } else {
      setErroresSeguidos(seguidos)
    }
    setMensaje(texto)
  }

  const revelarPalabra = () => {
    if (!activa || palabrasReveladas >= MAX_PALABRAS || ganaste) return
    const [dr, dc] = VECTOR[activa.dir]
    const celdas = Array.from({ length: activa.respuesta.length }, (_, i) => `${activa.r + dr * i},${activa.c + dc * i}`)
    setLetras((prev) => ({ ...prev, ...Object.fromEntries(celdas.map((k) => [k, solucion[k]])) }))
    setFijas((prev) => ({ ...prev, ...Object.fromEntries(celdas.map((k) => [k, true])) }))
    setRevision((prev) => { const n = { ...prev }; celdas.forEach((k) => delete n[k]); return n })
    setPalabrasReveladas(palabrasReveladas + 1)
    sonar('pista')
    setMensaje(`Palabra revelada. ${frase('pista')}`)
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
    sonar('pista')
    setMensaje(`Letra revelada. ${frase('pista')}`)
  }

  // la celda que recibe el foco al llegar con Tab: la seleccionada o, si no hay, la primera
  const clavePrimera = Object.keys(solucion)
    .map((k) => k.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])[0]
    .join(',')
  const ganaste = Object.keys(solucion).every((k) => letras[k] === solucion[k])
  const puntajeCruci = Math.max(0, 100 - 8 * pistas - 20 * palabrasReveladas)
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
      <Cabecera titulo={<>Crucigrama</>} onVolver={onVolver} onMenu={onMenu} />

      {juego.completado && (
        <p className="cartel" role="note">Este disco tiene pocas canciones cargadas: completamos con otras.</p>
      )}

      <SelectorDisco valor={discoId} onCambio={cambiarDisco} deshabilitado={!!desafio} />

      <p className="etiqueta-grupo">Dificultad</p>
      <div className="segmentado" role="group" aria-label="Dificultad">
        {[['casual', '🙂 Casual'], ['fanatico', '🔥 Fanático']].map(([id, etiqueta]) => (
          <button
            key={id}
            aria-pressed={dificultad === id}
            disabled={!!desafio}
            onClick={() => { setDificultad(id); guardar({ dificultad: id }); empezar(discoId, id) }}
          >
            {etiqueta}
          </button>
        ))}
      </div>


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
              ref={(el) => { celdas.current[k] = el }}
              tabIndex={(sel ? sel.r === r && sel.c === c : k === clavePrimera) ? 0 : -1}
              onKeyDown={(e) => alTeclaCelda(e, r, c)}
              onFocus={() => { if (!sel || sel.r !== r || sel.c !== c) seleccionarCelda(r, c, sel?.dir) }}
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

      {ganaste && (
        <Resultado
          titulo="Crucigrama"
          puntaje={`${puntajeCruci} pts`}
          detalle={`${entradas.length}/${entradas.length} palabras · letras reveladas: ${pistas} · palabras reveladas: ${palabrasReveladas}`}
          desafio={{ modo: 'crucigrama', disco: discoId, tema: temaId, dif: dificultad, semilla, puntaje: puntajeCruci }}
          rival={desafio ? { puntaje: desafio.puntaje } : null}
          mejor={{ etiqueta: 'Crucigramas completados', valor: completados }}
          mensaje={frase('victoria')}
          alMostrar={() => setCompletados(guardar({ crucigramas: leer().crucigramas + 1, partidas: leer().partidas + 1 }).crucigramas)}
          compartir={`Completé un crucigrama ricotero (${entradas.length} palabras) 🎸 ¿Podés superarme?`}
        />
      )}

      <p className="feedback" role="status" aria-live="polite">{ganaste ? '✓ ¡Completaste el crucigrama!' : mensaje}</p>

      <p className="contador-pistas">
        Letras: <strong>{MAX_PISTAS - pistas}</strong> · Palabras: <strong>{MAX_PALABRAS - palabrasReveladas}</strong>
      </p>

      <div className="herramientas">
        <button className="nueva" onClick={comprobar}>Comprobar</button>
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

      {desafio ? (
        <button className="nueva" onClick={onVolver}>Volver al menú</button>
      ) : (
        <button className="nueva" onClick={() => empezar(discoId)}>Nuevo crucigrama</button>
      )}
    </main>
  )
}
