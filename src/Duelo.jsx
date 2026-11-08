import { useEffect, useMemo, useRef, useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Ruleta from './Ruleta.jsx'
import Confeti from './Confeti.jsx'
import { Barra } from './Animados.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'
import { nuevaSemilla, crearAzar } from './azar.js'
import { leer } from './storage.js'
import {
  COLORES_JUGADOR, NIVELES_CPU, SUERTES, TIEMPO_BASE,
  armarPreguntas, elegirRespuestaCpu, ganadores, porcionesDeJugadores, puntosPorAcierto, puntosPorFallo,
} from './duelo.js'

const NOMBRES_DEFECTO = ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4']

function Configuracion({ onVolver, onMenu, onEmpezar }) {
  const [tipo, setTipo] = useState('amigos') // amigos | cpu
  const [cantidad, setCantidad] = useState(2)
  const [nombres, setNombres] = useState(NOMBRES_DEFECTO)
  const [nivelCpu, setNivelCpu] = useState('normal')
  const [porJugador, setPorJugador] = useState(5)
  const [categoria, setCategoria] = useState('general')
  const alias = leer().alias

  const empezar = () => {
    const base = tipo === 'cpu'
      ? [{ nombre: alias || 'Vos', cpu: false }, { nombre: 'CPU', cpu: true }]
      : nombres.slice(0, cantidad).map((n, i) => ({ nombre: n.trim() || NOMBRES_DEFECTO[i], cpu: false }))
    const jugadores = base.map((j, i) => ({ ...j, id: i, color: COLORES_JUGADOR[i], puntos: 0, aciertos: 0, racha: 0, mejorRacha: 0 }))
    onEmpezar({ jugadores, porJugador, categoria, acierto: NIVELES_CPU.find((n) => n.id === nivelCpu).acierto })
  }

  const grupo = (etiqueta, valor, set, opciones) => (
    <div className="duelo-campo">
      <span>{etiqueta}</span>
      <div className="segmentado" role="group" aria-label={etiqueta} style={{ gridTemplateColumns: `repeat(${opciones.length}, 1fr)` }}>
        {opciones.map(([id, texto]) => <button key={id} aria-pressed={valor === id} onClick={() => set(id)}>{texto}</button>)}
      </div>
    </div>
  )

  return (
    <main className="pantalla duelo" key="config">
      <Cabecera titulo="Duelo con ruleta" onVolver={onVolver} onMenu={onMenu} />
      <p className="aviso">La ruleta decide a quién le toca. Después gira otra para la suerte de la pregunta. ¡Cuanto más rápido respondés, más puntos!</p>
      {grupo('Contra quién', tipo, setTipo, [['amigos', '👥 Amigos'], ['cpu', '🤖 CPU']])}
      {tipo === 'amigos' ? (
        <>
          {grupo('Jugadores', cantidad, setCantidad, [[2, '2'], [3, '3'], [4, '4']])}
          <div className="duelo-nombres">
            {nombres.slice(0, cantidad).map((n, i) => (
              <label key={i} style={{ '--jc': COLORES_JUGADOR[i] }}>
                <i aria-hidden="true" />
                <input value={n} maxLength={14} aria-label={`Nombre del jugador ${i + 1}`} onChange={(e) => setNombres(nombres.map((x, k) => (k === i ? e.target.value : x)))} />
              </label>
            ))}
          </div>
        </>
      ) : grupo('Nivel de la CPU', nivelCpu, setNivelCpu, NIVELES_CPU.map((n) => [n.id, n.nombre]))}
      {grupo('Preguntas por jugador', porJugador, setPorJugador, [[3, '3'], [5, '5'], [8, '8']])}
      {grupo('Categoría', categoria, setCategoria, [['general', 'Trivia general'], ['banda', 'La banda']])}
      <button className="nueva" onClick={empezar}>¡A la ruleta!</button>
    </main>
  )
}

function Partida({ config, onSalir, onMenu, onRevancha, onCambiar }) {
  const { porJugador, categoria, acierto } = config
  const total = config.jugadores.length * porJugador
  const semilla = useRef(nuevaSemilla()).current
  const preguntas = useMemo(() => armarPreguntas(total, categoria, semilla), [total, categoria, semilla])
  const [jugadores, setJugadores] = useState(config.jugadores)
  const [pendientes, setPendientes] = useState(() => config.jugadores.map((j) => j.id)) // sin jugar en esta ronda
  const [ronda, setRonda] = useState(1)
  const [n, setN] = useState(0) // pregunta número n
  const [fase, setFase] = useState('turno') // turno | anuncio | suerte | pregunta | fin
  const [actual, setActual] = useState(null) // id del jugador en turno
  const [suerte, setSuerte] = useState(null)
  const [ocultas, setOcultas] = useState([])
  const [elegida, setElegida] = useState(null)
  const [restante, setRestante] = useState(TIEMPO_BASE)
  const [ganado, setGanado] = useState(null)
  const [fraseResp, setFraseResp] = useState('')
  const elegirRef = useRef(null)

  const jug = jugadores.find((j) => j.id === actual)
  const p = preguntas[n]
  const enRonda = jugadores.filter((j) => pendientes.includes(j.id))
  const tiempoMax = TIEMPO_BASE + (suerte?.id === 'tiempo' ? 10 : 0)

  // Si solo queda un jugador en la ronda, no hace falta girar.
  useEffect(() => {
    if (fase === 'turno' && enRonda.length === 1) {
      const t = setTimeout(() => { setActual(enRonda[0].id); setFase('anuncio') }, 900)
      return () => clearTimeout(t)
    }
    return undefined
  }, [fase, enRonda.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const alTurno = (idx) => {
    const porciones = porcionesDeJugadores(enRonda)
    setTimeout(() => { setActual(porciones[idx].id); setFase('anuncio') }, 900)
  }

  const alSuerte = (idx) => {
    const s = SUERTES[idx]
    setSuerte(s)
    if (s.id === 'mitad') {
      const malas = p.opciones.map((_, k) => k).filter((k) => k !== p.correcta)
      setOcultas(crearAzar().mezclar(malas).slice(0, 2))
    }
    setTimeout(() => { setRestante(TIEMPO_BASE + (s.id === 'tiempo' ? 10 : 0)); setFase('pregunta') }, 1800)
  }

  const responder = (idx) => {
    if (elegida !== null || fase !== 'pregunta') return
    const bien = idx === p.correcta
    const s = suerte.id
    const sumar = bien ? puntosPorAcierto({ restante, racha: jug.racha, suerte: s }) : puntosPorFallo(s)
    const regalo = s === 'rock' ? 5 : 0
    sonar(bien ? 'ok' : 'error')
    setElegida(idx)
    setGanado(sumar + regalo)
    setFraseResp(frase(bien ? 'acierto' : 'error'))
    setJugadores((js) => js.map((j) => (j.id !== jug.id ? j : {
      ...j,
      puntos: Math.max(0, j.puntos + sumar + regalo),
      aciertos: j.aciertos + (bien ? 1 : 0),
      racha: bien ? j.racha + 1 : 0,
      mejorRacha: Math.max(j.mejorRacha, bien ? j.racha + 1 : 0),
    })))
  }
  elegirRef.current = responder

  // reloj de la pregunta: al llegar a cero cuenta como respuesta fallida
  useEffect(() => {
    if (fase !== 'pregunta' || elegida !== null) return undefined
    if (restante <= 0) { elegirRef.current(-1); return undefined }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [fase, elegida, restante])

  // la CPU "piensa" y responde
  useEffect(() => {
    if (fase !== 'pregunta' || !jug?.cpu || elegida !== null) return undefined
    const t = setTimeout(() => elegirRef.current(elegirRespuestaCpu(p, acierto)), 1800 + Math.random() * 2200)
    return () => clearTimeout(t)
  }, [fase, jug?.cpu, elegida]) // eslint-disable-line react-hooks/exhaustive-deps

  const siguiente = () => {
    const quedan = pendientes.filter((id) => id !== actual)
    setElegida(null); setSuerte(null); setOcultas([]); setGanado(null)
    if (n + 1 >= total) { setFase('fin'); return }
    setN(n + 1)
    if (quedan.length === 0) {
      setPendientes(jugadores.map((j) => j.id))
      setRonda(ronda + 1)
    } else {
      setPendientes(quedan)
    }
    setFase('turno')
  }

  if (fase === 'fin') {
    const orden = [...jugadores].sort((a, b) => b.puntos - a.puntos)
    const gana = ganadores(jugadores)
    const empate = gana.length > 1
    const ganoCpu = gana.length === 1 && gana[0].cpu
    return (
      <main className="pantalla duelo" key="fin">
        {!ganoCpu && <Confeti />}
        <Cabecera titulo="Resultado final" onVolver={onSalir} onMenu={onMenu} />
        <h2 className="duelo-ganador">{empate ? `¡Empate entre ${gana.map((j) => j.nombre).join(' y ')}!` : `🏆 ¡Ganó ${gana[0].nombre}!`}</h2>
        <ol className="podio">
          {orden.map((j, i) => (
            <li key={j.id} style={{ '--jc': j.color }} className={gana.includes(j) ? 'campeon' : ''}>
              <span className="pos">{['🥇', '🥈', '🥉', '4º'][i]}</span>
              <span className="nom">{j.cpu ? '🤖 ' : ''}{j.nombre}<small>{j.aciertos}/{porJugador} aciertos · mejor racha {j.mejorRacha}</small></span>
              <strong>{j.puntos}</strong>
            </li>
          ))}
        </ol>
        <button className="nueva" onClick={onRevancha}>🔁 Revancha</button>
        <button className="secundario" onClick={onCambiar}>Cambiar jugadores</button>
      </main>
    )
  }

  const tablero = (
    <ul className="marcador" aria-label="Puntajes">
      {jugadores.map((j) => (
        <li key={j.id} style={{ '--jc': j.color }} className={j.id === actual && fase !== 'turno' ? 'activo' : ''}>
          <span>{j.cpu ? '🤖' : '🎤'} {j.nombre}</span>
          <b>{j.puntos}</b>
          {j.racha >= 2 && <em title="Racha de aciertos">🔥{j.racha}</em>}
        </li>
      ))}
    </ul>
  )
  const cabecera = <Cabecera titulo="Duelo" extra={`Ronda ${ronda} · ${n + 1}/${total}`} onVolver={onSalir} onMenu={onMenu} />

  if (fase === 'turno') {
    const porciones = porcionesDeJugadores(enRonda)
    return (
      <main className="pantalla duelo" key={`turno-${n}`}>
        {cabecera}{tablero}
        <Barra valor={n} max={total} etiqueta="Progreso del duelo" />
        <h3 className="duelo-titulo">{enRonda.length === 1 ? `Último turno de la ronda: ${enRonda[0].nombre}` : '¿A quién le toca?'}</h3>
        {enRonda.length > 1 && <Ruleta titulo="Ruleta de turnos" etiquetas={porciones} onResultado={alTurno} textoBoton="🎡 ¡Girar para elegir turno!" />}
      </main>
    )
  }

  if (fase === 'anuncio') {
    return (
      <main className="pantalla duelo" key={`anuncio-${n}`}>
        {cabecera}{tablero}
        <div className="anuncio-turno" style={{ '--jc': jug.color }}>
          <span aria-hidden="true">{jug.cpu ? '🤖' : '🎤'}</span>
          <h3>¡Le toca a {jug.nombre}!</h3>
          <p>{jug.cpu ? 'La CPU se prepara…' : 'Pasale el dispositivo y girá la ruleta de la suerte.'}</p>
        </div>
        <button className="nueva" onClick={() => setFase('suerte')}>{jug.cpu ? 'Seguir' : `Soy ${jug.nombre}, ¡listo!`}</button>
      </main>
    )
  }

  if (fase === 'suerte') {
    return (
      <main className="pantalla duelo" key={`suerte-${n}`}>
        {cabecera}{tablero}
        <h3 className="duelo-titulo">Ruleta de la suerte de {jug.nombre}</h3>
        <Ruleta titulo="Ruleta de la suerte" etiquetas={SUERTES} onResultado={alSuerte} autoGirar={jug.cpu} textoBoton="🍀 ¡Girar la suerte!" />
        {suerte && <p className="cartel suerte-aviso" role="status"><strong>{suerte.icono} {suerte.texto}</strong> · {suerte.detalle}</p>}
      </main>
    )
  }

  // pregunta
  const urgente = restante <= 5 && elegida === null
  return (
    <main className="pantalla duelo" key={`pregunta-${n}`}>
      {cabecera}{tablero}
      <p className="chips-suerte" style={{ '--jc': jug.color }}><strong>{jug.nombre}</strong> · {suerte.icono} {suerte.texto}</p>
      <div className={`reloj${urgente ? ' urgente' : ''}`} role="timer" aria-label={`Quedan ${restante} segundos`}>
        <span style={{ width: `${(Math.max(0, restante) / tiempoMax) * 100}%` }} />
        <b>{Math.max(0, restante)}s</b>
      </div>
      <div className="pregunta">
        <p>{p.texto}</p>
        {p.pistas && <ul className="lista">{p.pistas.map((w) => <li key={w}>{w}</li>)}</ul>}
        {elegida !== null && p.dato && <p className="datos-disco">{p.dato}</p>}
      </div>
      <div className="opciones">
        {p.opciones.map((o, idx) => {
          let estado = ''
          if (elegida !== null) {
            if (idx === p.correcta) estado = ' ok'
            else if (idx === elegida) estado = ' mal'
          }
          if (ocultas.includes(idx)) estado += ' oculta'
          return (
            <button key={o} className={`opcion${estado}`} disabled={elegida !== null || ocultas.includes(idx) || jug.cpu} onClick={() => responder(idx)}>
              {o}
              {estado.includes('ok') && <span className="marca">✓ Correcto</span>}
              {estado.includes('mal') && <span className="marca">✗ Incorrecto</span>}
            </button>
          )
        })}
      </div>
      {jug.cpu && elegida === null && <p className="feedback">🤖 La CPU está pensando…</p>}
      {elegida !== null && (
        <>
          <p className={`puntos-ganados${ganado > 0 ? ' pos' : ganado < 0 ? ' neg' : ''}`} role="status" aria-live="polite">
            {elegida === p.correcta ? `✓ Correcto. ${fraseResp}` : `✗ ${elegida === -1 ? 'Se acabó el tiempo.' : 'Incorrecto.'} Era: ${p.opciones[p.correcta]}`}
            {' '}<strong>{ganado > 0 ? `+${ganado}` : ganado < 0 ? ganado : '+0'} pts</strong>
          </p>
          <button className="btn-nav grande" onClick={siguiente}>{n + 1 >= total ? '🏁 Ver resultado' : '⏭ Siguiente turno'}</button>
        </>
      )}
    </main>
  )
}

export default function Duelo({ onVolver, onMenu }) {
  const [config, setConfig] = useState(null)
  const [vuelta, setVuelta] = useState(0)
  if (!config) return <Configuracion onVolver={onVolver} onMenu={onMenu} onEmpezar={setConfig} />
  const limpio = { ...config, jugadores: config.jugadores.map((j) => ({ ...j, puntos: 0, aciertos: 0, racha: 0, mejorRacha: 0 })) }
  return (
    <Partida
      key={vuelta}
      config={limpio}
      onSalir={() => setConfig(null)}
      onMenu={onMenu}
      onRevancha={() => setVuelta(vuelta + 1)}
      onCambiar={() => setConfig(null)}
    />
  )
}
