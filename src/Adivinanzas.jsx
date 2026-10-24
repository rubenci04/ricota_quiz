import { useState } from 'react'
import datos from './data/datos-ricotero.json'
import { guardar, leer } from './storage.js'
import { normalizarLetras } from './letras.js'
import Teclado from './Teclado.jsx'

const DIFICULTADES = {
  casual: { nombre: 'Casual', detalle: 'Año y disco desde el inicio, 3 pistas de letra', pistasLetra: 3 },
  fanatico: { nombre: 'Fanático', detalle: 'Sin datos al inicio, 1 pista de letra', pistasLetra: 1 },
}
const MODOS = {
  palabras: { nombre: 'Por palabras', detalle: 'Palabras clave de la canción' },
  parafraseado: { nombre: 'Dicho de otra forma', detalle: 'El título explicado con otras palabras' },
}

const canciones = datos.canciones.filter((c) => c.palabras.length >= 3)

// Una casilla por letra del título completo, agrupadas por palabra.
function armarCasillas(titulo) {
  return titulo
    .split(/\s+/)
    .map((pal) => [...pal].filter((ch) => /\p{L}/u.test(ch)).map(normalizarLetras))
    .filter((g) => g.length > 0)
}

function nuevaRonda(modo, anterior) {
  const pool = canciones.filter((c) => modo !== 'parafraseado' || c.titulo_parafraseado)
  let c
  do {
    c = pool[Math.floor(Math.random() * pool.length)]
  } while (c === anterior && pool.length > 1)
  const grupos = armarCasillas(c.titulo)
  return {
    cancion: c,
    claves: [...c.palabras].sort(() => Math.random() - 0.5),
    grupos,
    solucion: grupos.flat(),
  }
}

export default function Adivinanzas({ onVolver }) {
  const [config, setConfig] = useState({ dificultad: null, modo: null })
  const [jugando, setJugando] = useState(false)
  const [ronda, setRonda] = useState(null)
  const [letras, setLetras] = useState([])
  const [fijas, setFijas] = useState([])
  const [revision, setRevision] = useState([])
  const [foco, setFoco] = useState(0)
  const [pistasLetra, setPistasLetra] = useState(0)
  const [extra, setExtra] = useState(false)
  const [resultado, setResultado] = useState(null) // { acierto, puntos }
  const [total, setTotal] = useState(() => leer().adivinanzas)

  const empezar = (anterior = null, cfg = config) => {
    const r = nuevaRonda(cfg.modo, anterior)
    const n = r.solucion.length
    setRonda(r)
    setLetras(Array(n).fill(''))
    setFijas(Array(n).fill(false))
    setRevision(Array(n).fill(''))
    setFoco(0)
    setPistasLetra(0)
    setExtra(false)
    setResultado(null)
    setJugando(true)
  }

  const elegir = (campo, valor) => {
    const cfg = { ...config, [campo]: valor }
    setConfig(cfg)
    if (cfg.dificultad && cfg.modo) empezar(null, cfg)
  }

  if (!jugando) {
    return (
      <main className="pantalla">
        <header className="barra">
          <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
          <h2>Adivinanzas</h2>
          <span className="contador">{total} pts</span>
        </header>
        <h3 className="subtitulo">Dificultad</h3>
        <div className="menu">
          {Object.entries(DIFICULTADES).map(([id, d]) => (
            <button key={id} className={`modo${config.dificultad === id ? ' elegido' : ''}`} onClick={() => elegir('dificultad', id)}>
              <span>{d.nombre}<small>{d.detalle}</small></span>
            </button>
          ))}
        </div>
        <h3 className="subtitulo">Modo</h3>
        <div className="menu">
          {Object.entries(MODOS).map(([id, m]) => (
            <button key={id} className={`modo${config.modo === id ? ' elegido' : ''}`} onClick={() => elegir('modo', id)}>
              <span>{m.nombre}<small>{m.detalle}</small></span>
            </button>
          ))}
        </div>
        <p className="ayuda">Elegí las dos opciones para empezar.</p>
      </main>
    )
  }

  const { cancion, claves, grupos, solucion } = ronda
  const dif = DIFICULTADES[config.dificultad]
  const disco = datos.discos.find((d) => d.id === cancion.disco)
  const mostrarDatos = config.dificultad === 'casual'

  const terminar = (nuevasLetras, usadas) => {
    if (!nuevasLetras.every((l, i) => l === solucion[i])) return false
    const puntos = usadas === 0 ? 3 : usadas === 1 ? 2 : 1
    setTotal(guardar({ adivinanzas: leer().adivinanzas + puntos }).adivinanzas)
    setResultado({ acierto: true, puntos })
    return true
  }

  const siguienteLibre = (desde) => {
    for (let i = desde + 1; i < solucion.length; i++) if (!fijas[i]) return i
    return desde
  }

  const limpiarRevision = (i) => setRevision((prev) => prev.map((x, k) => (k === i ? '' : x)))

  const ponerLetra = (l) => {
    if (resultado) return
    if (!fijas[foco]) {
      setLetras((prev) => prev.map((x, k) => (k === foco ? l : x)))
      limpiarRevision(foco)
    }
    setFoco(siguienteLibre(foco))
  }

  const borrar = () => {
    if (resultado) return
    if (letras[foco] && !fijas[foco]) {
      setLetras((prev) => prev.map((x, k) => (k === foco ? '' : x)))
      limpiarRevision(foco)
      return
    }
    for (let i = foco - 1; i >= 0; i--) {
      if (!fijas[i]) {
        setFoco(i)
        setLetras((prev) => prev.map((x, k) => (k === i ? '' : x)))
        limpiarRevision(i)
        return
      }
    }
  }

  const comprobar = () => {
    if (resultado) return
    setRevision(letras.map((l, i) => (l ? (l === solucion[i] ? 'ok' : 'mal') : '')))
    terminar(letras, pistasLetra)
  }

  const pistaDeLetra = () => {
    if (resultado || pistasLetra >= dif.pistasLetra) return
    const faltan = solucion.map((_, i) => i).filter((i) => letras[i] !== solucion[i])
    if (!faltan.length) return
    const i = faltan[Math.floor(Math.random() * faltan.length)]
    const nuevas = letras.map((x, k) => (k === i ? solucion[i] : x))
    setLetras(nuevas)
    setFijas((prev) => prev.map((x, k) => (k === i ? true : x)))
    limpiarRevision(i)
    setPistasLetra(pistasLetra + 1)
    terminar(nuevas, pistasLetra + 1)
  }

  const rendirse = () => {
    setLetras(solucion)
    setResultado({ acierto: false, puntos: 0 })
  }

  let indice = 0
  const casillas = grupos.map((g, gi) => (
    <div className="grupo-palabra" key={gi}>
      {g.map(() => {
        const i = indice++
        const clases = ['casilla']
        if (i === foco && !resultado) clases.push('foco')
        if (revision[i]) clases.push(revision[i])
        if (fijas[i]) clases.push('fija')
        return (
          <button key={i} className={clases.join(' ')} onClick={() => setFoco(i)} aria-label={`Letra ${i + 1}`}>
            {letras[i]}
          </button>
        )
      })}
    </div>
  ))

  const palabrasVisibles = claves.slice(0, extra ? 5 : 3)

  return (
    <main className="pantalla">
      <header className="barra">
        <button className="volver" onClick={() => setJugando(false)} aria-label="Cambiar dificultad o modo">←</button>
        <h2>Adivinanzas</h2>
        <span className="contador">{total} pts</span>
      </header>

      <div className="pregunta">
        <p>Adiviná la canción <small className="etiqueta">{dif.nombre} · {MODOS[config.modo].nombre}</small></p>
        {config.modo === 'palabras' ? (
          <ul className="lista">
            {palabrasVisibles.map((w) => <li key={w}>{w}</li>)}
          </ul>
        ) : (
          <p className="parafrasis">«{cancion.titulo_parafraseado}»</p>
        )}
        {mostrarDatos && <p className="datos-disco">Disco: {disco.titulo} ({disco.anio})</p>}
      </div>

      <div className="casillas" aria-label="Título de la canción">{casillas}</div>

      {!resultado && (
        <>
          <Teclado onTecla={ponerLetra} onBorrar={borrar} />
          <div className="herramientas">
            <button className="secundario" onClick={comprobar}>Comprobar</button>
            <button className="secundario" onClick={pistaDeLetra} disabled={pistasLetra >= dif.pistasLetra}>
              Pista de letra ({dif.pistasLetra - pistasLetra})
            </button>
          </div>
          <div className="herramientas">
            {config.modo === 'palabras' && (
              <button className="secundario" onClick={() => setExtra(true)} disabled={extra || claves.length <= 3}>
                Otra pista
              </button>
            )}
            <button className="secundario" onClick={rendirse}>Me rindo</button>
          </div>
        </>
      )}

      {resultado && (
        <>
          <div className="victoria">
            {resultado.acierto
              ? <><strong>¡Correcto!</strong> +{resultado.puntos} {resultado.puntos === 1 ? 'punto' : 'puntos'}</>
              : <>La respuesta era: <strong>{cancion.titulo}</strong></>}
          </div>
          <button className="nueva" onClick={() => empezar(cancion)}>Otra canción</button>
        </>
      )}
    </main>
  )
}
