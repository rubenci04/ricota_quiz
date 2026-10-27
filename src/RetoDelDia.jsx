import { nivelTitulo } from './dificultad.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import AyudaPartida, { useSuertePartida } from './AyudaPartida.jsx'
import Cabecera from './Cabecera.jsx'
import datos from './data/datos-ricotero.json'
import Teclado from './Teclado.jsx'
import Resultado from './Resultado.jsx'
import { armarCasillas, mismaLetra } from './adivinanza.js'
import { normalizarLetras } from './letras.js'
import { prepararLetras } from './letrasIniciales.js'
import { INTENTOS_MAX, cuadro, fechaBA, guardarReto, msHastaProximo, rachaAlEmpezar, rachaCortada, rachaVigente, retoDe, retoGuardadoDeHoy, textoCompartir } from './reto.js'
import { leer } from './storage.js'
import { sonar } from './sonido.js'
import { frase } from './textos.js'

const dosDigitos = (n) => String(n).padStart(2, '0')

function CuentaRegresiva() {
  const [ms, setMs] = useState(() => msHastaProximo())
  useEffect(() => {
    const id = setInterval(() => setMs(msHastaProximo()), 1000)
    return () => clearInterval(id)
  }, [])
  if (ms <= 0) return <p className="feedback">¡Ya hay reto nuevo! Volvé al menú y entrá de nuevo.</p>
  const s = Math.floor(ms / 1000)
  return (
    <p className="cuenta" role="timer" aria-label="Tiempo hasta el próximo reto">
      Próximo reto en <strong>{dosDigitos(Math.floor(s / 3600))}:{dosDigitos(Math.floor((s % 3600) / 60))}:{dosDigitos(s % 60)}</strong>
    </p>
  )
}

export default function RetoDelDia({ onVolver, onMenu }) {
  const [fecha] = useState(() => fechaBA())
  const [racha] = useState(() => rachaAlEmpezar(leer(), fecha))
  const reto = useMemo(() => retoDe(fecha, racha), [fecha, racha])
  const grupos = useMemo(() => armarCasillas(reto.cancion.titulo), [reto])
  const solucion = useMemo(() => grupos.flatMap((g) => g.letras), [grupos])
  const guardado = useRef(retoGuardadoDeHoy(fecha)).current
  const iniciales = useMemo(() => prepararLetras(grupos, 'casual', `reto-${fecha}`, nivelTitulo(reto.cancion.titulo)), [grupos, fecha])

  const suerte = useSuertePartida(`reto:${fecha}`, 'casual')
  const [pistasLetra,setPistasLetra] = useState(0)
  const [resultados, setResultados] = useState(guardado?.resultados ?? [])
  const [terminado, setTerminado] = useState(guardado?.terminado ?? false)
  const [gano, setGano] = useState(guardado?.gano ?? false)
  const [letras, setLetras] = useState(() => (guardado?.terminado ? solucion : iniciales.letras))
  const [revision, setRevision] = useState(() => Array(solucion.length).fill(''))
  const [foco, setFoco] = useState(iniciales.foco)
  const [mensaje, setMensaje] = useState('')
  const yaTerminadoAlEntrar = useRef(guardado?.terminado === true).current
  const estadoInicial = useRef(leer()).current

  const fallos = resultados.length

  const limpiarRevision = (i) => setRevision((prev) => prev.map((x, k) => (k === i ? '' : x)))

  const ponerLetra = (l) => {
    if (terminado || iniciales.fijas[foco]) return
    const guardada = mismaLetra(l, solucion[foco]) ? solucion[foco] : l
    setLetras((prev) => prev.map((x, k) => (k === foco ? guardada : x)))
    limpiarRevision(foco)
    const siguiente = iniciales.fijas.findIndex((f, i) => i > foco && !f)
    if (siguiente >= 0) setFoco(siguiente)
  }

  const borrar = () => {
    if (terminado) return
    if (letras[foco] && !iniciales.fijas[foco]) {
      setLetras((prev) => prev.map((x, k) => (k === foco ? '' : x)))
      limpiarRevision(foco)
    } else {
      const anterior = iniciales.fijas.map((f, i) => !f && i < foco ? i : -1).filter((i) => i >= 0).at(-1)
      if (anterior === undefined) return
      setFoco(anterior)
      setLetras((prev) => prev.map((x, k) => (k === anterior ? '' : x)))
      limpiarRevision(anterior)
    }
  }

  const probar = () => {
    if (terminado) return
    if (letras.some((l) => !l)) {
      setMensaje('Completá todas las casillas antes de probar.')
      return
    }
    const aciertos = letras.map((l, i) => mismaLetra(l, solucion[i]))
    const buenas = aciertos.filter(Boolean).length
    const ganaste = buenas === solucion.length
    const nuevos = [...resultados, buenas / solucion.length]
    const fin = ganaste || nuevos.length >= INTENTOS_MAX
    setRevision(aciertos.map((a) => (a ? 'ok' : 'mal')))
    setResultados(nuevos)
    setTerminado(fin)
    setGano(ganaste)
    guardarReto(fecha, nuevos, fin, ganaste)
    if (ganaste) {
      sonar('ok')
      setMensaje(`✓ ¡Era esa! ${frase('victoria')}`)
    } else {
      sonar('error')
      if (fin) setLetras(solucion)
      setMensaje(
        fin
          ? `✗ Se acabaron los intentos. ${frase('derrota')}`
          : `✗ Intento ${nuevos.length}/${INTENTOS_MAX}: ${buenas} de ${solucion.length} letras. ${frase('error')}`,
      )
    }
  }

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
  acciones.current = (e) => {
    if (terminado) return
    if (e.key === 'Backspace') {
      e.preventDefault()
      borrar()
    } else if (e.key === 'Enter') {
      const boton = e.target.closest?.('button')
      if (boton && !boton.classList.contains('casilla')) return
      e.preventDefault()
      probar()
    } else if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
      const l = normalizarLetras(e.key)
      if (/^[A-ZÑ]$/.test(l)) ponerLetra(l)
    }
  }

  const disco = datos.discos.find((d) => d.id === reto.cancion.disco)
  const palabrasVisibles = reto.palabras.slice(0, fallos >= 4 ? 5 : 3)
  const pistas = [
    { desde: 1, texto: `Dicho de otra forma: ${reto.dicho}` },
    { desde: 2, texto: `Disco: ${disco.titulo} (${disco.anio})` },
    { desde: 3, texto: `Empieza con «${reto.cancion.titulo[0].toUpperCase()}»` },
  ]

  const cortada = rachaCortada(estadoInicial, fecha)
  const rachaActual = terminado ? rachaVigente(leer(), fecha) : rachaVigente(estadoInicial, fecha)
  const rachaMaxima = Math.max(leer().rachaMax, rachaActual)

  let indice = 0
  const casillas = grupos.map((g, gi) => (
    <div className="par-casillas" key={gi}>
      <div className="grupo-palabra">
        {g.letras.map(() => {
          const i = indice++
          const clases = ['casilla']
          if (i === foco && !terminado) clases.push('foco')
          if (revision[i]) clases.push(revision[i])
          if (iniciales.fijas[i]) clases.push('inicial')
          const estado = revision[i] === 'ok' ? ', correcta' : revision[i] === 'mal' ? ', incorrecta' : ''
          return (
            <button key={i} disabled={iniciales.fijas[i]} className={clases.join(' ')} onClick={() => setFoco(i)} aria-label={`Letra ${i + 1}: ${letras[i] || 'vacía'}${estado}`}>
              {letras[i]}
            </button>
          )
        })}
      </div>
      {g.guionDespues && <span className="guion" aria-hidden="true">-</span>}
    </div>
  ))

  return (
    <main className="pantalla" key="reto">
      <Cabecera titulo={<>Reto del día #{reto.numero}</>} extra={<>{fecha}</>} onVolver={onVolver} onMenu={onMenu} />

      {!terminado && <AyudaPartida suerte={suerte} base={Math.max(0,3-pistasLetra)} errores={resultados.length} onPista={()=>{
        const n=solucion.findIndex((l,i)=>!mismaLetra(letras[i],l));if(n<0)return false;
        setLetras(prev=>prev.map((l,i)=>i===n?solucion[i]:l));setPistasLetra(v=>v+1)
      }} />}
      {cortada && !terminado && (
        <p className="aviso-amable" role="note">
          Ayer te tomaste franco y la racha se reinició, pero no pasa nada: hoy arrancás otra. 💪
        </p>
      )}

      <div className="pregunta">
        <p>Adiviná la canción del día <small className="etiqueta">{Math.min(fallos, INTENTOS_MAX)}/{INTENTOS_MAX} intentos</small></p>
        <ul className="lista">{palabrasVisibles.map((w) => <li key={w}>{w}</li>)}</ul>
        {pistas.map((p) =>
          fallos >= p.desde || terminado ? (
            <p key={p.desde} className="datos-disco">{p.texto}</p>
          ) : (
            <p key={p.desde} className="datos-disco bloqueada">🔒 Pista {p.desde + 1}: se desbloquea tras {p.desde} {p.desde === 1 ? 'intento fallido' : 'intentos fallidos'}</p>
          ),
        )}
      </div>

      <p className="contador-pistas">
        Pistas reveladas: <strong>{terminado ? 4 : Math.min(4, 1 + fallos)}</strong> de 4 · Intentos que quedan: <strong>{Math.max(0, INTENTOS_MAX - fallos)}</strong>
      </p>

      <div className="casillas" aria-label="Título de la canción">{casillas}</div>
      <p className="feedback" role="status" aria-live="polite">{mensaje}</p>

      {resultados.length > 0 && (
        <p className="cuadros" aria-label={`Intentos: ${resultados.map((r) => (r >= 1 ? 'acierto' : r >= 0.5 ? 'cerca' : 'lejos')).join(', ')}`}>
          {resultados.map(cuadro).join('')}
        </p>
      )}

      {!terminado && (
        <>
          <Teclado onTecla={ponerLetra} onBorrar={borrar} />
          <button className="nueva" onClick={probar}>Probar</button>
        </>
      )}

      {terminado && (
        <Resultado
          titulo={`Reto del día #${reto.numero}`}
          puntaje={`${gano ? resultados.length : 'X'}/${INTENTOS_MAX}`}
          detalle={`${resultados.map(cuadro).join('')} · Era «${reto.cancion.titulo}»`}
          mejor={{ etiqueta: 'Racha de días', valor: `${rachaActual} (máx. ${rachaMaxima})` }}
          mensaje={gano ? frase('victoria') : frase('derrota')}
          exito={gano && !yaTerminadoAlEntrar}
          compartir={textoCompartir(reto, resultados, gano)}
        >
          <CuentaRegresiva />
        </Resultado>
      )}
    </main>
  )
}
