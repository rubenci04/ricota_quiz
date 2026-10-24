import { useState } from 'react'
import { PREGUNTAS_POR_NIVEL, armarNivel, curiosidadAlAzar } from './trivia.js'
import { guardar, leer } from './storage.js'

const PUNTOS_PARA_PASAR = 6

export default function Trivia({ onVolver }) {
  const [vista, setVista] = useState('niveles') // niveles | jugando | fin
  const [nivel, setNivel] = useState(1)
  const [preguntas, setPreguntas] = useState([])
  const [i, setI] = useState(0)
  const [elegida, setElegida] = useState(null)
  const [puntos, setPuntos] = useState(0)
  const [curiosidad, setCuriosidad] = useState(null)
  const [guardado, setGuardado] = useState(leer)

  const jugar = (n) => {
    setNivel(n)
    setPreguntas(armarNivel(n))
    setI(0)
    setElegida(null)
    setPuntos(0)
    setVista('jugando')
  }

  const responder = (idx) => {
    if (elegida !== null) return
    setElegida(idx)
    if (idx === preguntas[i].correcta) setPuntos(puntos + 1)
  }

  const siguiente = () => {
    if (i + 1 < preguntas.length) {
      setI(i + 1)
      setElegida(null)
      return
    }
    const actual = leer()
    setGuardado(
      guardar({
        nivel: puntos >= PUNTOS_PARA_PASAR ? Math.max(actual.nivel, nivel + 1) : actual.nivel,
        mejor: Math.max(actual.mejor, puntos),
      }),
    )
    setCuriosidad(puntos >= PUNTOS_PARA_PASAR ? curiosidadAlAzar() : null)
    setVista('fin')
  }

  if (vista === 'niveles') {
    return (
      <main className="pantalla">
        <header className="barra">
          <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
          <h2>Trivia</h2>
          <span className="contador">Récord {guardado.mejor}/{PREGUNTAS_POR_NIVEL}</span>
        </header>
        <div className="menu">
          {Array.from({ length: guardado.nivel }, (_, k) => k + 1).reverse().map((n) => (
            <button key={n} className="modo" onClick={() => jugar(n)}>
              <span>Nivel {n}</span>
              {n === guardado.nivel && <em className="pronto nuevo">Nuevo</em>}
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (vista === 'fin') {
    return (
      <main className="pantalla">
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
    <main className="pantalla">
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
      </div>
      <div className="opciones">
        {p.opciones.map((o, idx) => {
          let estado = ''
          if (elegida !== null) {
            if (idx === p.correcta) estado = ' ok'
            else if (idx === elegida) estado = ' mal'
          }
          return (
            <button key={o} className={`opcion${estado}`} disabled={elegida !== null} onClick={() => responder(idx)}>
              {o}
            </button>
          )
        })}
      </div>
      {elegida !== null && (
        <button className="nueva" onClick={siguiente}>
          {i + 1 < preguntas.length ? 'Siguiente' : 'Terminar'}
        </button>
      )}
    </main>
  )
}
