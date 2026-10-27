import { useEffect, useRef, useState } from 'react'
import { guardar, leer, sumarPartida } from './storage.js'
import { normalizarLetras } from './letras.js'
import { prepararLetras } from './letrasIniciales.js'
import { nivelTitulo } from './dificultad.js'
import Teclado from './Teclado.jsx'
import Resultado from './Resultado.jsx'
import AyudaPartida, { useSuertePartida } from './AyudaPartida.jsx'
import Cabecera from './Cabecera.jsx'
import SelectorDisco from './SelectorDisco.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'
import { crearAzar } from './azar.js'
import { crearPartida, registrarVista } from './historial.js'
import { useRegistrarInicial } from './useHistorial.js'
import { idsAdivinanza } from './identidad.js'
import {
  CATEGORIAS,
  DIFICULTADES,
  MODOS_ADIVINANZA,
  etiquetaDe,
  leerToken,
  mismaLetra,
  nuevaRonda,
  rondaToken,
} from './adivinanza.js'
import { nombreDeTema } from './temas.js'
import datos from './data/datos-ricotero.json'

// Pistas de letra según dificultad (incluye 2 extra). La pista automática tras 2 errores seguidos no cuenta.
const PISTAS_LETRA = { casual: 5, fanatico: 3 }
const ERRORES_PARA_PISTA = 2
const PALABRAS_INICIALES = { casual: 6, fanatico: 5 } // «Otra pista» suma 2 más
const PALABRAS_EXTRA = 2

// Solo las respuestas que son títulos de canción tienen nivel de título
const nivelDeRespuesta = (r) => (r.modo === 'palabras' || r.categoria === 'canciones' ? nivelTitulo(r.respuesta) : 1)

function prepararRonda(opciones) {
  const p = crearPartida(opciones.modo === 'palabras' ? 'palabras' : `dicho${opciones.categoria}`, (semilla, plan) => nuevaRonda({ ...opciones, semilla, plan }), idsAdivinanza)
  return { ...p.juego, plan: { ...p.plan, reglasAdivinanza: 2 }, ids: p.ids }
}

export default function Adivinanzas({ onVolver, onMenu, desafio = null, inicio = 'dicho' }) {
  // un desafío recibido arranca directo, con la misma ronda (misma semilla)
  const desafioToken = desafio ? leerToken(desafio.ronda) : null
  const inicial = useRef(undefined)
  if (inicial.current === undefined) {
    if (desafio && desafioToken) {
      inicial.current = nuevaRonda({ ...desafioToken, dif: desafio.dif, semilla: desafio.semilla, disco: desafio.disco, tema: desafio.tema, plan: desafio.plan })
    } else if (inicio === 'palabras') {
      inicial.current = prepararRonda({ modo: 'palabras', categoria: 'canciones', dif: 'casual' })
    } else {
      inicial.current = null
    }
  }
  const largo = inicial.current ? inicial.current.solucion.length : 0
  useRegistrarInicial('palabras', inicial.current?.ids, !desafio)
  const ayudaInicial = inicial.current ? prepararLetras(inicial.current.grupos, inicial.current.dif, inicial.current.semilla, nivelDeRespuesta(inicial.current)) : { letras: [], fijas: [], iniciales: [], foco: 0 }

  const [dif, setDif] = useState(desafio ? desafio.dif : 'casual')
  const [modo, setModo] = useState(desafioToken ? desafioToken.modo : inicio)
  const [disco, setDisco] = useState(desafio ? desafio.disco : 'todos')
  const [tema, setTema] = useState(desafio ? desafio.tema : 'todos')
  const [semilla, setSemilla] = useState(inicial.current?.semilla ?? '')
  const [ronda, setRonda] = useState(inicial.current)
  const suerte = useSuertePartida(`adivinanzas:${semilla}:${modo}:${dif}`, dif)
  const [letras, setLetras] = useState(ayudaInicial.letras)
  const [fijas, setFijas] = useState(ayudaInicial.fijas)
  const [iniciales, setIniciales] = useState(ayudaInicial.iniciales)
  const [revision, setRevision] = useState(() => Array(largo).fill(''))
  const [foco, setFoco] = useState(ayudaInicial.foco)
  const [pistasLetra, setPistasLetra] = useState(0)
  const [extrasVistos, setExtrasVistos] = useState(0)
  const [erroresSeguidos, setErroresSeguidos] = useState(0)
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

  // arranca una partida: la última elección queda guardada para ofrecer "Repetir"
  const empezar = ({ modo: m = modo, categoria = 'canciones', difi = dif, anterior = null } = {}) => {
    const r = prepararRonda({ modo: m, categoria, dif: difi, anterior, disco, tema })
    const sem = r.semilla
    registrarVista(m === 'palabras' ? 'palabras' : `dicho${categoria}`, r.ids)
    const n = r.solucion.length
    setSemilla(sem)
    setModo(m)
    setRonda(r)
    const ayuda = prepararLetras(r.grupos, difi, sem, nivelDeRespuesta(r))
    setLetras(ayuda.letras)
    setFijas(ayuda.fijas)
    setIniciales(ayuda.iniciales)
    setRevision(Array(n).fill(''))
    setFoco(ayuda.foco)
    setPistasLetra(0)
    setExtrasVistos(0)
    setErroresSeguidos(0)
    setResultado(null)
    setMensaje('')
    if (!desafio) guardar({ ultimaEleccion: { modo: m, categoria: m === 'palabras' ? 'canciones' : categoria } })
  }

  const cambiarDificultad = (id) => {
    setDif(id)
    guardar({ dificultad: id })
  }

  // Entrada normal: solo canciones. Los desafíos antiguos conservan su categoría.
  if (!ronda) {
    acciones.current = null
    return (
      <main className="pantalla" key="adivinanzas-entrada">
        <Cabecera titulo="Dicho de otra forma" extra={`${total} pts`} onVolver={onVolver} onMenu={onMenu} />

        <p className="etiqueta-grupo">Dificultad</p>
        <div className="segmentado" role="group" aria-label="Dificultad">
          {DIFICULTADES.map((d) => (
            <button key={d.id} aria-pressed={dif === d.id} onClick={() => cambiarDificultad(d.id)}>
              {d.icono} {d.etiqueta}
            </button>
          ))}
        </div>

        <button className="nueva" onClick={() => empezar({ modo: inicio, categoria: 'canciones' })}>Jugar</button>

        <details className="filtros">
          <summary>Filtrar por disco (opcional)</summary>
          <SelectorDisco valor={disco} onCambio={setDisco} />
        </details>
      </main>
    )
  }

  // ---------------- partida
  const { grupos, solucion } = ronda
  const maxPistas = PISTAS_LETRA[ronda.dif]
  const extraDisponibles = ronda.modo === 'palabras' ? (extrasVistos ? 0 : 1) : ronda.extras.length - extrasVistos

  const terminar = (nuevasLetras, usadas) => {
    if (!nuevasLetras.every((l, i) => mismaLetra(l, solucion[i]))) return false
    // Casual regala 40%: base 2; Ricotero mantiene base 3. Iniciales gratis.
    const legado = desafio && desafio.plan?.reglasAdivinanza !== 2
    const puntos = Math.max(1, (ronda.dif === 'casual' && !legado ? 2 : 3) - usadas)
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

  // revela una letra al azar (devuelve las letras nuevas)
  const revelarLetra = (base) => {
    const faltan = solucion.map((_, i) => i).filter((i) => !mismaLetra(base[i], solucion[i]))
    if (!faltan.length) return null
    const i = crearAzar(`${semilla}-pista-${fijas.filter(Boolean).length}`).elegir(faltan)
    const nuevas = base.map((x, k) => (k === i ? solucion[i] : x))
    setLetras(nuevas)
    setFijas((prev) => prev.map((x, k) => (k === i ? true : x)))
    limpiarRevision(i)
    return nuevas
  }

  const comprobar = () => {
    if (resultado) return
    const rev = letras.map((l, i) => (l ? (mismaLetra(l, solucion[i]) ? 'ok' : 'mal') : ''))
    setRevision(rev)
    const buenas = rev.filter((x) => x === 'ok').length
    const malas = rev.filter((x) => x === 'mal').length
    if (malas) sonar('error')
    else if (buenas) sonar('ok')
    if (terminar(letras, pistasLetra)) return
    let texto = `✓ ${buenas} ${buenas === 1 ? 'letra correcta' : 'letras correctas'} · ✗ ${malas} ${malas === 1 ? 'incorrecta' : 'incorrectas'}. ${frase(malas ? 'error' : 'acierto')}`
    // pista automática tras 2 intentos fallidos seguidos: una letra gratis, sin restar puntos
    const seguidos = malas ? erroresSeguidos + 1 : 0
    if (seguidos >= ERRORES_PARA_PISTA && pistasLetra < maxPistas) {
      const nuevas = revelarLetra(letras)
      if (nuevas) {
        sonar('pista')
        texto += ' Te regalo una letra para que sigas.'
        terminar(nuevas, pistasLetra)
      }
      setErroresSeguidos(0)
    } else {
      setErroresSeguidos(seguidos)
    }
    setMensaje(texto)
  }

  const pistaDeLetra = (extra = false) => {
    if (resultado || (!extra && pistasLetra >= maxPistas)) return false
    const nuevas = revelarLetra(letras)
    if (!nuevas) return false
    setPistasLetra(pistasLetra + 1)
    sonar('pista')
    if (!terminar(nuevas, pistasLetra + 1)) setMensaje(`Pista: te revelé una letra. ${frase('pista')}`)
  }

  const otraPista = () => {
    if (extraDisponibles <= 0) return
    setExtrasVistos(extrasVistos + 1)
    sonar('pista')
    setMensaje(`Otra pista. ${frase('pista')}`)
  }

  const rendirse = () => {
    sumarPartida()
    setLetras(solucion)
    setResultado({ acierto: false, puntos: 0 })
    setMensaje(`✗ Te rendiste. La respuesta era: ${ronda.respuesta}. ${frase('derrota')}`)
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
          if (iniciales[i]) clases.push('inicial')
          const estado = revision[i] === 'ok' ? ', correcta' : revision[i] === 'mal' ? ', incorrecta' : ''
          return (
            <button
              key={i}
              className={clases.join(' ')}
              disabled={fijas[i]}
              aria-description={iniciales[i] ? 'Letra inicial gratuita, bloqueada' : undefined}
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

  const categoria = etiquetaDe(CATEGORIAS, ronda.categoria)
  const modoInfo = etiquetaDe(MODOS_ADIVINANZA, ronda.modo)
  const difInfo = etiquetaDe(DIFICULTADES, ronda.dif)
  const palabrasVisibles = ronda.palabras ? ronda.palabras.slice(0, PALABRAS_INICIALES[ronda.dif] + (extrasVistos ? PALABRAS_EXTRA : 0)) : []

  return (
    <main className="pantalla" key="adivinanzas-juego">
      <Cabecera
        titulo={modoInfo.etiqueta}
        extra={`${total} pts`}
        onVolver={() => (desafio ? onVolver() : setRonda(null))}
        onMenu={onMenu}
      />
        {!desafio && <div className="segmentado" role="group" aria-label="Dificultad">{DIFICULTADES.map(d => <button key={d.id} aria-pressed={ronda.dif===d.id} onClick={() => { setDif(d.id); empezar({ modo: inicio, categoria: 'canciones', difi: d.id }) }}>{d.icono} {d.etiqueta}</button>)}</div>}

      {!resultado && <AyudaPartida suerte={suerte} base={Math.max(0,maxPistas-pistasLetra)} onPista={()=>pistaDeLetra(true)} errores={erroresSeguidos} />}
      <ul className="chips-juego" aria-label="Partida">
        <li>{modoInfo.icono} {modoInfo.etiqueta}</li>
        <li>{categoria.icono} {categoria.etiqueta}</li>
        <li>{difInfo.icono} {difInfo.etiqueta}</li>
        {disco !== 'todos' && <li>💿 {datos.discos.find((d) => d.id === disco)?.titulo}</li>}
        {tema !== 'todos' && <li>{nombreDeTema(tema)}</li>}
      </ul>

      {ronda.completada && (
        <p className="cartel" role="note">Este disco tiene pocas canciones cargadas: completamos con otras.</p>
      )}

      <div className="pregunta">
        {ronda.modo === 'palabras' ? (
          <>
            <p>Adiviná la canción por sus palabras</p>
            <ul className="lista">{palabrasVisibles.map((w) => <li key={w}>{w}</li>)}</ul>
          </>
        ) : (
          <>
            <p className="parafrasis">{ronda.principal}</p>
            {ronda.extras.slice(0, extrasVistos).map((t) => <p key={t} className="datos-disco">➕ {t}</p>)}
          </>
        )}
        {ronda.gratis.map((t) => <p key={t} className="datos-disco">{t}</p>)}
      </div>

      <div className="casillas" aria-label="Respuesta">{casillas}</div>
      <p className="feedback" role="status" aria-live="polite">{mensaje}</p>
      <p className="contador-pistas">
        Pistas de letra: <strong>{Math.max(0,maxPistas - pistasLetra)}</strong> · Otras pistas: <strong>{extraDisponibles}</strong>
      </p>

      {!resultado && (
        <>
          <Teclado onTecla={ponerLetra} onBorrar={borrar} />
          <div className="herramientas">
            <button className="nueva" onClick={comprobar}>Comprobar</button>
          </div>
          <div className="herramientas">
            <button className="secundario" onClick={otraPista} disabled={extraDisponibles <= 0}>
              ➕ Otra pista ({extraDisponibles})
            </button>
          </div>
          <button className="secundario" onClick={rendirse}>🏳️ Me rindo</button>
        </>
      )}

      {resultado && (
        <Resultado
          canciones={resultado.acierto&&ronda.cancion?[ronda.cancion.titulo]:[]}
          titulo={resultado.acierto ? 'Adivinanzas · ¡Correcto!' : `Era «${ronda.respuesta}»`}
          puntaje={resultado.acierto ? `+${resultado.puntos}` : '0'}
          detalle={resultado.acierto ? `Pistas de letra usadas: ${pistasLetra}` : 'Esta vez no sumaste puntos.'}
          mejor={{ etiqueta: 'Total acumulado', valor: `${total} pts` }}
          mensaje={resultado.acierto ? frase('victoria') : frase('derrota')}
          exito={resultado.acierto}
          desafio={{
            modo: 'adivinanzas',
            ronda: rondaToken(ronda.modo, ronda.categoria),
            disco,
            tema,
            dif: ronda.dif,
            semilla,
            plan: desafio ? desafio.plan : ronda.plan,
            puntaje: resultado.puntos,
          }}
          rival={desafio ? { puntaje: desafio.puntaje } : null}
          compartir={`Sumé ${total} puntos adivinando canciones ricoteras 🎸 ¿Podés superarme?`}
        >
          {desafio ? (
            <button className="nueva" onClick={onVolver}>Volver al menú</button>
          ) : (
            <button className="nueva" onClick={() => empezar({ modo: ronda.modo, categoria: 'canciones', difi: ronda.dif, anterior: ronda.id })}>
              Otra más
            </button>
          )}
        </Resultado>
      )}
    </main>
  )
}
