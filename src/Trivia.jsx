import { useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { PREGUNTAS_POR_NIVEL, armarNivel, armarNivelBanda, curiosidadAlAzar } from './trivia.js'
import { LIMITES, PUNTOS_PARA_PASAR, iniciarNivel, terminarNivel, maximoAlcanzado } from './niveles.js'
import { guardar, leer } from './storage.js'
import Resultado from './Resultado.jsx'
import { Barra } from './Animados.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'
import { crearAzar } from './azar.js'
import { crearPartida, registrarVista } from './historial.js'
import { idsTrivia } from './identidad.js'

export default function Trivia({ onVolver, onMenu, categoria = 'general', desafio = null }) {
  const banda = categoria === 'banda'
  const modo = banda ? 'banda' : 'trivia'
  const limite = LIMITES[modo]
  const version = desafio?.version ?? (desafio ? 1 : 3)
  const dif = desafio ? desafio.dif : leer().dificultad // la dificultad decide qué largo de títulos puede aparecer
  const [plan, setPlan] = useState(desafio?.plan)
  const kMejor = banda ? 'mejorBanda' : 'mejor'
  const [vista, setVista] = useState(desafio ? 'jugando' : 'niveles') // niveles | jugando | fin
  const [nivel, setNivel] = useState(desafio ? desafio.nivel : 1)
  const temaId = desafio ? desafio.tema : 'todos'
  const [semilla, setSemilla] = useState(desafio ? desafio.semilla : '') // con la misma semilla salen las mismas preguntas
  const [preguntas, setPreguntas] = useState(() =>
    desafio ? (banda ? armarNivelBanda(desafio.nivel, desafio.semilla, version, desafio.plan, dif) : armarNivel(desafio.nivel, desafio.semilla, desafio.tema, version, desafio.plan, dif)) : [],
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
    const partida = crearPartida(modo, (sem, p) => banda ? armarNivelBanda(n, sem, 3, p, dif) : armarNivel(n, sem, temaId, 3, p, dif), idsTrivia, n)
    const sem = partida.semilla, ronda = partida.juego
    setGuardado(iniciarNivel(modo, n))
    registrarVista(modo, partida.ids)
    setPlan(partida.plan)
    setSemilla(sem)
    setNivel(n)
    setPreguntas(ronda)
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
    const quedan = crearAzar(`${semilla}-comodin-${i}`).mezclar(malas.filter((k) => !ocultas.includes(k)))
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
        setOcultas([crearAzar(`${semilla}-auto-${i}`).elegir(malas)])
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
    setGuardado(terminarNivel(modo, nivel, puntos))
    setCuriosidad(puntos >= PUNTOS_PARA_PASAR ? curiosidadAlAzar() : null)
    setVista('fin')
  }

  if (vista === 'niveles') {
    return (
      <main className="pantalla" key="niveles">
        <Cabecera titulo={<>{banda ? 'La banda' : 'Trivia'}</>} extra={<>Récord {guardado[kMejor]}/{PREGUNTAS_POR_NIVEL}</>} onVolver={onVolver} onMenu={onMenu} />
        <p>Nivel máximo alcanzado: {maximoAlcanzado(guardado, modo)} de {limite}. Necesitás 6 de 10 para avanzar.</p>
        <p className="aviso">{banda ? 'Aumentan las preguntas curadas de la banda.' : 'Aumentan las preguntas de palabras y títulos.'} Son {limite} etapas con un banco compartido; podés repetir las disponibles.</p>
        <div className="menu-grid">
          {Array.from({ length: limite }, (_, k) => k + 1).map((n, idx) => (
            <button key={n} disabled={n > maximoAlcanzado(guardado, modo)} className="tarjeta-modo chica" style={{ '--c': 'var(--modo)', '--i': idx }} onClick={() => jugar(n)}>
              <span className="icono" aria-hidden="true">{n > maximoAlcanzado(guardado, modo) ? '🔒' : '🎸'}</span>
              <strong>Nivel {n}</strong>
              <small>{n > maximoAlcanzado(guardado, modo) ? 'Bloqueado' : 'Disponible'}</small>
              <small>Mejor: {guardado.niveles[modo][n]?.mejor ?? 0}/10 · Intentos: {guardado.niveles[modo][n]?.intentos ?? 0}</small>
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
          detalle={desafio ? 'Desafío terminado. No cambia tus niveles.' : paso ? (nivel === limite ? '¡Completaste todas las etapas! Podés repetirlas para mejorar tus récords.' : `Nivel ${nivel + 1} disponible.`) : `Intentá de nuevo: necesitás ${PUNTOS_PARA_PASAR} o más para pasar.`}
          mejor={{ etiqueta: 'Mejor puntaje', valor: `${guardado[kMejor]}/${PREGUNTAS_POR_NIVEL}` }}
          mensaje={paso ? frase('victoria') : frase('derrota')}
          exito={paso}
          desafio={{ modo, nivel, tema: banda ? 'todos' : temaId, dif, version, semilla, plan, puntaje: puntos }}
          rival={desafio ? { puntaje: desafio.puntaje } : null}
          compartir={`Hice ${puntos}/${preguntas.length} en ${banda ? 'el desafío de La banda' : 'la trivia'} 🎸 ¿Podés superarme?`}
        >
          {desafio ? (
            <button className="nueva" onClick={onVolver}>Volver al menú</button>
          ) : (
            <>
              {curiosidad && <div className="curiosidad"><strong>Curiosidad:</strong> {curiosidad}</div>}
              {paso && nivel < limite && <button className="nueva" onClick={() => jugar(nivel + 1)}>Nivel {nivel + 1}</button>}
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
      <Barra valor={i + (elegida !== null ? 1 : 0)} max={preguntas.length} etiqueta="Progreso del nivel" />
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
