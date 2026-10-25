import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { PREGUNTAS_POR_NIVEL, armarNivel, armarNivelBanda, curiosidadAlAzar, triviaTieneTema } from './trivia.js'
import { guardar, leer } from './storage.js'
import Resultado from './Resultado.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'
import { nuevaSemilla } from './desafio.js'
import SelectorTema from './SelectorTema.jsx'

const PUNTOS_PARA_PASAR = 6

export default function Trivia({ onVolver, onMenu, categoria = 'general', desafio = null }) {
  const banda = categoria === 'banda'
  const kNivel = banda ? 'nivelBanda' : 'nivel'
  const kMejor = banda ? 'mejorBanda' : 'mejor'
  const [vista, setVista] = useState(desafio ? 'jugando' : 'niveles') // niveles | jugando | fin
  const [nivel, setNivel] = useState(desafio ? desafio.nivel : 1)
  const [temaId, setTemaId] = useState(desafio ? desafio.tema : 'todos')
  const [semilla, setSemilla] = useState(desafio ? desafio.semilla : '') // con la misma semilla salen las mismas preguntas
  const [preguntas, setPreguntas] = useState(() =>
    desafio ? (banda ? armarNivelBanda(desafio.nivel, desafio.semilla) : armarNivel(desafio.nivel, desafio.semilla, desafio.tema)) : [],
  )
  const [i, setI] = useState(0)
  const [elegida, setElegida] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [curiosidad, setCuriosidad] = useState(null)
  const [guardado, setGuardado] = useState(leer)

  const [comodinUsado, setComodinUsado] = useState(false) // 50/50: una vez por nivel
  const [ocultas, setOcultas] = useState([]) // opciones eliminadas por el 50/50
  const [verAyuda, setVerAyuda] = useState(false)
  const [erroresSeguidos, setErroresSeguidos] = useState(0) // 2 seguidos → se descarta una opción mala en la próxima
  const [avisoAuto, setAvisoAuto] = useState('')
  const [fraseResp, setFraseResp] = useState('')

  const jugar = (n) => {
    const sem = nuevaSemilla()
    setSemilla(sem)
    setNivel(n)
    setPreguntas(banda ? armarNivelBanda(n, sem) : armarNivel(n, sem, temaId))
    setI(0)
    setElegida(null)
    setPuntos(0)
    setComodinUsado(false)
    setOcultas([])
    setVerAyuda(false)
    setErroresSeguidos(0)
    setAvisoAuto('')
    setVista('jugando')
  }

  const responder = (idx) => {
    if (elegida !== null) return
    setElegida(idx)
    const acierto = idx === preguntas[i].correcta
    sonar(acierto ? 'ok' : 'error')
    setFraseResp(frase(acierto ? 'acierto' : 'error'))
    if (acierto) setPuntos(puntos + 1)
    setErroresSeguidos(acierto ? 0 : erroresSeguidos + 1)
  }

  const usarComodin = () => {
    if (comodinUsado || elegida !== null) return
    const p = preguntas[i]
    const malas = p.opciones.map((_, k) => k).filter((k) => k !== p.correcta)
    // si la pista automática ya descartó una opción, el 50/50 deja solo una mala
    const quedan = malas.filter((k) => !ocultas.includes(k)).sort(() => Math.random() - 0.5)
    setOcultas([...ocultas, ...quedan.slice(0, Math.max(0, 2 - ocultas.length))])
    setComodinUsado(true)
    sonar('pista')
  }

  const siguiente = () => {
    if (i + 1 < preguntas.length) {
      setI(i + 1)
      setElegida(null)
      // pista automática tras 2 errores seguidos: en la próxima pregunta se descarta una opción incorrecta
      const proxima = preguntas[i + 1]
      if (erroresSeguidos >= 2 && proxima) {
        const malas = proxima.opciones.map((_, k) => k).filter((k) => k !== proxima.correcta)
        setOcultas([malas[Math.floor(Math.random() * malas.length)]])
        setAvisoAuto('Te descarté una opción incorrecta para ayudarte.')
        setErroresSeguidos(0)
        sonar('pista')
      } else {
        setOcultas([])
        setAvisoAuto('')
      }
      setVerAyuda(false)
      return
    }
    if (desafio) {
      // un desafío recibido no toca el progreso de niveles
      guardar({ partidas: leer().partidas + 1 })
      setCuriosidad(null)
      setVista('fin')
      return
    }
    const actual = leer()
    setGuardado(
      guardar({
        [kNivel]: puntos >= PUNTOS_PARA_PASAR ? Math.max(actual[kNivel], nivel + 1) : actual[kNivel],
        [kMejor]: Math.max(actual[kMejor], puntos),
        partidas: actual.partidas + 1,
      }),
    )
    setCuriosidad(puntos >= PUNTOS_PARA_PASAR ? curiosidadAlAzar() : null)
    setVista('fin')
  }

  if (vista === 'niveles') {
    return (
      <main className="pantalla" key="niveles">
        <Cabecera titulo={<>{banda ? 'La banda' : 'Trivia'}</>} extra={<>Récord {guardado[kMejor]}/{PREGUNTAS_POR_NIVEL}</>} onVolver={onVolver} onMenu={onMenu} />
        {!banda && <SelectorTema valor={temaId} onCambio={setTemaId} />}
        <div className="menu-grid">
          {Array.from({ length: guardado[kNivel] }, (_, k) => k + 1).reverse().map((n, idx) => (
            <button key={n} className="tarjeta-modo chica" style={{ '--c': 'var(--modo)', '--i': idx }} onClick={() => jugar(n)}>
              {n === guardado[kNivel] && <span className="insignia">Nuevo</span>}
              <span className="icono" aria-hidden="true">{n === guardado[kNivel] ? '🚀' : '✅'}</span>
              <strong>Nivel {n}</strong>
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (vista === 'fin') {
    const paso = puntos >= PUNTOS_PARA_PASAR
    return (
      <main className="pantalla" key="fin">
        <Resultado
          titulo={`${banda ? 'La banda' : 'Trivia'} · Nivel ${nivel}`}
          puntaje={`${puntos}/${preguntas.length}`}
          detalle={paso ? `Se desbloqueó el nivel ${nivel + 1}.` : `Intentá de nuevo: necesitás ${PUNTOS_PARA_PASAR} o más para pasar.`}
          mejor={{ etiqueta: 'Mejor puntaje', valor: `${guardado[kMejor]}/${PREGUNTAS_POR_NIVEL}` }}
          mensaje={paso ? frase('victoria') : frase('derrota')}
          exito={paso}
          desafio={{ modo: banda ? 'banda' : 'trivia', nivel, tema: banda ? 'todos' : temaId, dif: 'casual', semilla, puntaje: puntos }}
          rival={desafio ? { puntaje: desafio.puntaje } : null}
          compartir={`Hice ${puntos}/${preguntas.length} en ${banda ? 'el desafío de La banda' : 'la trivia'} 🎸 ¿Podés superarme?`}
        >
          {desafio ? (
            <button className="nueva" onClick={onVolver}>Volver al menú</button>
          ) : (
            <>
              {curiosidad && <div className="curiosidad"><strong>Curiosidad:</strong> {curiosidad}</div>}
              {paso && <button className="nueva" onClick={() => jugar(nivel + 1)}>Nivel {nivel + 1}</button>}
              <button className="secundario" onClick={() => jugar(nivel)}>Repetir nivel</button>
              <button className="secundario" onClick={() => setVista('niveles')}>Elegir nivel</button>
            </>
          )}
        </Resultado>
      </main>
    )
  }

  const p = preguntas[i]
  return (
    <main className="pantalla" key="jugando">
      <Cabecera titulo={<>Nivel {nivel}</>} extra={<>{i + 1}/{preguntas.length}</>} onVolver={() => (desafio ? onVolver() : setVista('niveles'))} onMenu={onMenu} />
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
            ✂️ 50/50 ({comodinUsado ? 0 : 1})
          </button>
          <button className="secundario" onClick={() => { setVerAyuda(true); sonar('pista') }} disabled={verAyuda}>
            💡 Pista ({verAyuda ? 0 : 1})
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
      {avisoAuto && elegida === null && <p className="cartel" role="note">{avisoAuto}</p>}
      <p className="feedback" role="status" aria-live="polite">
        {elegida === null ? '' : elegida === p.correcta ? `✓ Correcto. ${fraseResp}` : `✗ Incorrecto. La respuesta era: ${p.opciones[p.correcta]}. ${fraseResp}`}
      </p>
      {elegida !== null && (
        <button className="btn-nav grande" onClick={siguiente}>
          {i + 1 < preguntas.length ? '⏭ Siguiente' : '🏁 Terminar'}
        </button>
      )}
    </main>
  )
}
