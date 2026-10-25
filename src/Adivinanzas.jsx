import { useEffect, useRef, useState } from 'react'
import datos from './data/datos-ricotero.json'
import { guardar, leer, sumarPartida } from './storage.js'
import { normalizarLetras } from './letras.js'
import Teclado from './Teclado.jsx'
import Resultado from './Resultado.jsx'
import { sonar } from './sonido.js'
import { hayRonda, mismaLetra, nuevaRonda } from './adivinanza.js'
import SelectorTema from './SelectorTema.jsx'
import { frase } from './textos.js'
import { nuevaSemilla } from './desafio.js'

const DIFICULTADES = {
  casual: { nombre: 'Casual', detalle: 'Año y disco desde el inicio, 3 pistas de letra', pistasLetra: 3 },
  fanatico: { nombre: 'Fanático', detalle: 'Sin datos al inicio, 1 pista de letra', pistasLetra: 1 },
}
const MODOS = {
  palabras: { nombre: 'Por palabras', detalle: 'Palabras clave de la canción' },
  parafraseado: { nombre: 'Dicho de otra forma', detalle: 'El título explicado con otras palabras' },
}

export default function Adivinanzas({ onVolver, desafio = null }) {
  // un desafío recibido arranca directo, con la misma ronda (misma semilla)
  const inicial = useRef(undefined)
  if (inicial.current === undefined) inicial.current = desafio ? nuevaRonda(desafio.ronda, null, desafio.semilla, desafio.disco, desafio.tema) : null
  const largo = inicial.current ? inicial.current.solucion.length : 0
  const [semilla, setSemilla] = useState(desafio ? desafio.semilla : '')
  const [config, setConfig] = useState(() => ({
    dificultad: desafio ? desafio.dif : leer().dificultad,
    modo: desafio ? desafio.ronda : 'palabras',
    disco: desafio ? desafio.disco : 'todos',
    tema: desafio ? desafio.tema : 'todos',
  }))
  const [jugando, setJugando] = useState(!!desafio)
  const [ronda, setRonda] = useState(inicial.current)
  const [letras, setLetras] = useState(() => Array(largo).fill(''))
  const [fijas, setFijas] = useState(() => Array(largo).fill(false))
  const [revision, setRevision] = useState(() => Array(largo).fill(''))
  const [foco, setFoco] = useState(0)
  const [pistasLetra, setPistasLetra] = useState(0)
  const [extra, setExtra] = useState(false)
  const [resultado, setResultado] = useState(null) // { acierto, puntos }
  const [mensaje, setMensaje] = useState('')
  const [total, setTotal] = useState(() => leer().adivinanzas)

  // teclado físico: el manejador vigente se actualiza en cada render
  const acciones = useRef(null)
  useEffect(() => {
    const alTecla = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return
      acciones.current?.(e)
    }
    window.addEventListener('keydown', alTecla)
    return () => window.removeEventListener('keydown', alTecla)
  }, [])

  const empezar = (anterior = null, cfg = config) => {
    const sem = nuevaSemilla()
    setSemilla(sem)
    const r = nuevaRonda(cfg.modo, anterior, sem, cfg.disco, cfg.tema)
    const n = r.solucion.length
    setRonda(r)
    setLetras(Array(n).fill(''))
    setFijas(Array(n).fill(false))
    setRevision(Array(n).fill(''))
    setFoco(0)
    setPistasLetra(0)
    setExtra(false)
    setResultado(null)
    setMensaje('')
    setJugando(true)
  }

  const elegir = (campo, valor) => {
    setConfig({ ...config, [campo]: valor })
    if (campo === 'dificultad') guardar({ dificultad: valor })
  }

  if (!jugando) {
    acciones.current = null
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
            <button key={id} className={`modo${config.dificultad === id ? ' elegido' : ''}`} aria-pressed={config.dificultad === id} onClick={() => elegir('dificultad', id)}>
              <span>{d.nombre}<small>{d.detalle}</small></span>
            </button>
          ))}
        </div>
        <h3 className="subtitulo">Modo</h3>
        <div className="menu">
          {Object.entries(MODOS).map(([id, m]) => (
            <button key={id} className={`modo${config.modo === id ? ' elegido' : ''}`} aria-pressed={config.modo === id} onClick={() => elegir('modo', id)}>
              <span>{m.nombre}<small>{m.detalle}</small></span>
            </button>
          ))}
        </div>
        <label className="selector">
          <span>Disco</span>
          <select value={config.disco} onChange={(e) => elegir('disco', e.target.value)}>
            <option value="todos">Todos</option>
            {datos.discos.map((d) => {
              const ok = hayRonda(config.modo, d.id, config.tema)
              return (
                <option key={d.id} value={d.id} disabled={!ok}>
                  {d.titulo} ({d.anio}){ok ? '' : ' – pocos datos'}
                </option>
              )
            })}
          </select>
        </label>
        <SelectorTema valor={config.tema} onCambio={(t) => elegir('tema', t)} tieneDatos={(t) => hayRonda(config.modo, config.disco, t)} />
        <button className="nueva" onClick={() => empezar()} disabled={!hayRonda(config.modo, config.disco, config.tema)}>Jugar</button>
      </main>
    )
  }

  const { cancion, claves, grupos, solucion } = ronda
  const dif = DIFICULTADES[config.dificultad]
  const disco = datos.discos.find((d) => d.id === cancion.disco)
  const mostrarDatos = config.dificultad === 'casual'

  const terminar = (nuevasLetras, usadas) => {
    if (!nuevasLetras.every((l, i) => mismaLetra(l, solucion[i]))) return false
    const puntos = usadas === 0 ? 3 : usadas === 1 ? 2 : 1
    const e = leer()
    setTotal(
      guardar({
        adivinanzas: e.adivinanzas + puntos,
        partidas: e.partidas + 1,
        adivinanzaSinPistas: e.adivinanzaSinPistas || usadas === 0,
      }).adivinanzas,
    )
    setResultado({ acierto: true, puntos })
    setMensaje(`✓ Correcto. Sumaste ${puntos} ${puntos === 1 ? 'punto' : 'puntos'}. ${frase('acierto')}`)
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
      // si se escribe N donde va Ñ, se guarda la Ñ
      const guardada = mismaLetra(l, solucion[foco]) ? solucion[foco] : l
      setLetras((prev) => prev.map((x, k) => (k === foco ? guardada : x)))
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
    const rev = letras.map((l, i) => (l ? (mismaLetra(l, solucion[i]) ? 'ok' : 'mal') : ''))
    setRevision(rev)
    const buenas = rev.filter((x) => x === 'ok').length
    const malas = rev.filter((x) => x === 'mal').length
    if (malas) sonar('error')
    else if (buenas) sonar('ok')
    if (!terminar(letras, pistasLetra)) {
      setMensaje(`✓ ${buenas} ${buenas === 1 ? 'letra correcta' : 'letras correctas'} · ✗ ${malas} ${malas === 1 ? 'incorrecta' : 'incorrectas'}. ${frase(malas ? 'error' : 'acierto')}`)
    }
  }

  const pistaDeLetra = () => {
    if (resultado || pistasLetra >= dif.pistasLetra) return
    const faltan = solucion.map((_, i) => i).filter((i) => !mismaLetra(letras[i], solucion[i]))
    if (!faltan.length) return
    const i = faltan[Math.floor(Math.random() * faltan.length)]
    const nuevas = letras.map((x, k) => (k === i ? solucion[i] : x))
    setLetras(nuevas)
    setFijas((prev) => prev.map((x, k) => (k === i ? true : x)))
    limpiarRevision(i)
    setPistasLetra(pistasLetra + 1)
    sonar('pista')
    if (!terminar(nuevas, pistasLetra + 1)) setMensaje(`Pista: te revelé una letra. ${frase('pista')}`)
  }

  const rendirse = () => {
    sumarPartida()
    setLetras(solucion)
    setResultado({ acierto: false, puntos: 0 })
    setMensaje(`✗ Te rendiste. La respuesta era: ${cancion.titulo}. ${frase('derrota')}`)
  }

  acciones.current = (e) => {
    if (resultado) return
    if (e.key === 'Backspace') {
      e.preventDefault()
      borrar()
    } else if (e.key === 'Enter') {
      // Enter sobre otro botón lo activa ese botón; sobre una casilla o la página, comprueba
      const boton = e.target.closest?.('button')
      if (boton && !boton.classList.contains('casilla')) return
      e.preventDefault()
      comprobar()
    } else if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
      const l = normalizarLetras(e.key)
      if (/^[A-ZÑ]$/.test(l)) ponerLetra(l)
    }
  }

  let indice = 0
  const casillas = grupos.map((g, gi) => (
    <div className="par-casillas" key={gi}>
      <div className="grupo-palabra">
        {g.letras.map(() => {
          const i = indice++
          const clases = ['casilla']
          if (i === foco && !resultado) clases.push('foco')
          if (revision[i]) clases.push(revision[i])
          if (fijas[i]) clases.push('fija')
          const estado = revision[i] === 'ok' ? ', correcta' : revision[i] === 'mal' ? ', incorrecta' : ''
          return (
            <button
              key={i}
              className={clases.join(' ')}
              onClick={() => setFoco(i)}
              aria-label={`Letra ${i + 1}: ${letras[i] || 'vacía'}${estado}`}
            >
              {letras[i]}
            </button>
          )
        })}
      </div>
      {g.guionDespues && <span className="guion" aria-hidden="true">-</span>}
    </div>
  ))

  const palabrasVisibles = claves.slice(0, extra ? 5 : 3)

  return (
    <main className="pantalla">
      <header className="barra">
        <button className="volver" onClick={() => (desafio ? onVolver() : setJugando(false))} aria-label={desafio ? 'Volver al menú' : 'Cambiar dificultad o modo'}>←</button>
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
      <p className="feedback" role="status" aria-live="polite">{mensaje}</p>

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
              <button className="secundario" onClick={() => { setExtra(true); sonar('pista'); setMensaje(`Dos palabras más. ${frase('pista')}`) }} disabled={extra || claves.length <= 3}>
                Otra pista
              </button>
            )}
            <button className="secundario" onClick={rendirse}>Me rindo</button>
          </div>
        </>
      )}

      {resultado && (
        <Resultado
          titulo={resultado.acierto ? 'Adivinanzas · ¡Correcto!' : `Era «${cancion.titulo}»`}
          puntaje={resultado.acierto ? `+${resultado.puntos}` : '0'}
          detalle={resultado.acierto ? `Pistas de letra usadas: ${pistasLetra}` : 'Esta vez no sumaste puntos.'}
          mejor={{ etiqueta: 'Total acumulado', valor: `${total} pts` }}
          mensaje={resultado.acierto ? frase('victoria') : frase('derrota')}
          exito={resultado.acierto}
          desafio={{ modo: 'adivinanzas', ronda: config.modo, disco: config.disco, tema: config.tema, dif: config.dificultad, semilla, puntaje: resultado.puntos }}
          rival={desafio ? { puntaje: desafio.puntaje } : null}
          compartir={`Sumé ${total} puntos adivinando canciones ricoteras 🎸 ¿Podés superarme?`}
        >
          {desafio ? (
            <button className="nueva" onClick={onVolver}>Volver al menú</button>
          ) : (
            <button className="nueva" onClick={() => empezar(cancion)}>Otra canción</button>
          )}
        </Resultado>
      )}
    </main>
  )
}
