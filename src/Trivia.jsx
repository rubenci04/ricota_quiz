import { useState } from 'react'
import { PREGUNTAS_POR_NIVEL, armarNivel, armarNivelBanda, curiosidadAlAzar } from './trivia.js'
import { guardar, leer } from './storage.js'
import Confeti from './Confeti.jsx'
import { sonar } from './sonido.js'

const PUNTOS_PARA_PASAR = 6

export default function Trivia({ onVolver, categoria = 'general' }) {
  const banda = categoria === 'banda'
  const kNivel = banda ? 'nivelBanda' : 'nivel'
  const kMejor = banda ? 'mejorBanda' : 'mejor'
  const [vista, setVista] = useState('niveles') // niveles | jugando | fin
  const [nivel, setNivel] = useState(1)
  const [preguntas, setPreguntas] = useState([])
  const [i, setI] = useState(0)
  const [elegida, setElegida] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [curiosidad, setCuriosidad] = useState(null)
  const [guardado, setGuardado] = useState(leer)

  const [comodinUsado, setComodinUsado] = useState(false) // 50/50: una vez por nivel
  const [ocultas, setOcultas] = useState([]) // opciones eliminadas por el 50/50
  const [verAyuda, setVerAyuda] = useState(false)

  const jugar = (n) => {
    setNivel(n)
    setPreguntas(banda ? armarNivelBanda(n) : armarNivel(n))
    setI(0)
    setElegida(null)
    setPuntos(0)
    setComodinUsado(false)
    setOcultas([])
    setVerAyuda(false)
    setVista('jugando')
  }

  const responder = (idx) => {
    if (elegida !== null) return
    setElegida(idx)
    const acierto = idx === preguntas[i].correcta
    sonar(acierto ? 'ok' : 'error')
    if (acierto) setPuntos(puntos + 1)
  }

  const usarComodin = () => {
    if (comodinUsado || elegida !== null) return
    const p = preguntas[i]
    const malas = p.opciones.map((_, k) => k).filter((k) => k !== p.correcta)
    setOcultas(malas.sort(() => Math.random() - 0.5).slice(0, 2))
    setComodinUsado(true)
  }

  const siguiente = () => {
    if (i + 1 < preguntas.length) {
      setI(i + 1)
      setElegida(null)
      setOcultas([])
      setVerAyuda(false)
      return
    }
    const actual = leer()
    setGuardado(
      guardar({
        [kNivel]: puntos >= PUNTOS_PARA_PASAR ? Math.max(actual[kNivel], nivel + 1) : actual[kNivel],
        [kMejor]: Math.max(actual[kMejor], puntos),
      }),
    )
    setCuriosidad(puntos >= PUNTOS_PARA_PASAR ? curiosidadAlAzar() : null)
    setVista('fin')
  }

  if (vista === 'niveles') {
    return (
      <main className="pantalla" key="niveles">
        <header className="barra">
          <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
          <h2>{banda ? 'La banda' : 'Trivia'}</h2>
          <span className="contador">Récord {guardado[kMejor]}/{PREGUNTAS_POR_NIVEL}</span>
        </header>
        <div className="menu">
          {Array.from({ length: guardado[kNivel] }, (_, k) => k + 1).reverse().map((n) => (
            <button key={n} className="modo" onClick={() => jugar(n)}>
              <span>Nivel {n}</span>
              {n === guardado[kNivel] && <em className="pronto nuevo">Nuevo</em>}
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (vista === 'fin') {
    return (
      <main className="pantalla" key="fin">
        {puntos >= PUNTOS_PARA_PASAR && <Confeti />}
        <h2 className="logo chico">Nivel {nivel}</h2>
        <div className="victoria">
          <strong>{puntos}/{preguntas.length}</strong> respuestas correctas
          <br />
          {puntos >= PUNTOS_PARA_PASAR
            ? `Se desbloqueó el nivel ${nivel + 1}.`
            : `Intentá de nuevo: necesitás ${PUNTOS_PARA_PASAR} o más para pasar.`}
        </div>
        {curiosidad && <div className="curiosidad"><strong>Curiosidad:</strong> {curiosidad}</div>}
        {puntos >= PUNTOS_PARA_PASAR && (
          <button className="nueva" onClick={() => jugar(nivel + 1)}>Nivel {nivel + 1}</button>
        )}
        <button className="secundario" onClick={() => jugar(nivel)}>Repetir nivel</button>
        <button className="secundario" onClick={() => setVista('niveles')}>Elegir nivel</button>
      </main>
    )
  }

  const p = preguntas[i]
  return (
    <main className="pantalla" key="jugando">
      <header className="barra">
        <button className="volver" onClick={() => setVista('niveles')} aria-label="Salir del nivel">←</button>
        <h2>Nivel {nivel}</h2>
        <span className="contador">{i + 1}/{preguntas.length}</span>
      </header>
      <div className="pregunta">
        <p>{p.texto}</p>
        {p.pistas && (
          <ul className="lista">
            {p.pistas.map((w) => <li key={w}>{w}</li>)}
          </ul>
        )}
        {verAyuda && <p className="datos-disco">Pista: {p.ayuda}</p>}
        {elegida !== null && p.dato && <p className="datos-disco">{p.dato}</p>}
      </div>
      {elegida === null && (
        <div className="herramientas">
          <button className="secundario" onClick={usarComodin} disabled={comodinUsado}>
            50/50 {comodinUsado ? '(usado)' : '(1)'}
          </button>
          <button className="secundario" onClick={() => setVerAyuda(true)} disabled={verAyuda}>
            Pista gratis
          </button>
        </div>
      )}
      <div className="opciones">
        {p.opciones.map((o, idx) => {
          let estado = ''
          if (elegida !== null) {
            if (idx === p.correcta) estado = ' ok'
            else if (idx === elegida) estado = ' mal'
          }
          if (ocultas.includes(idx)) estado += ' oculta'
          return (
            <button
              key={o}
              className={`opcion${estado}`}
              disabled={elegida !== null || ocultas.includes(idx)}
              onClick={() => responder(idx)}
            >
              {o}
              {estado.includes('ok') && <span className="marca">✓ Correcto</span>}
              {estado.includes('mal') && <span className="marca">✗ Incorrecto</span>}
            </button>
          )
        })}
      </div>
      <p className="feedback" role="status" aria-live="polite">
        {elegida === null ? '' : elegida === p.correcta ? '✓ Correcto' : `✗ Incorrecto. La respuesta era: ${p.opciones[p.correcta]}`}
      </p>
      {elegida !== null && (
        <button className="nueva" onClick={siguiente}>
          {i + 1 < preguntas.length ? 'Siguiente' : 'Terminar'}
        </button>
      )}
    </main>
  )
}
