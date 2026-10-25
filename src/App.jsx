import { useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'
import Trivia from './Trivia.jsx'
import Adivinanzas from './Adivinanzas.jsx'
import Crucigrama from './Crucigrama.jsx'
import Tutorial from './Tutorial.jsx'
import Musica from './Musica.jsx'
import {
  alternarSonido,
  alternarVibracion,
  sonar,
  sonidoActivo,
  vibracionActiva,
  vibracionDisponible,
} from './sonido.js'
import { leer } from './storage.js'

const MODOS = [
  { id: 'banda', nombre: 'La banda', detalle: 'Trivia de nicho para los que saben', activo: true },
  { id: 'sopa', nombre: 'Sopa de letras', activo: true },
  { id: 'trivia', nombre: 'Trivia', activo: true },
  { id: 'adivinanzas', nombre: 'Adivinanzas', detalle: 'Dicho de otra forma', activo: true },
  { id: 'crucigrama', nombre: 'Crucigrama', activo: true },
]

export default function App() {
  const [entro, setEntro] = useState(false)
  const [verTutorial, setVerTutorial] = useState(() => !leer().tutorial)
  const [jugadores, setJugadores] = useState(null) // 'solo' | null (vs amigo: próximamente)
  const [modo, setModo] = useState(null)
  const [sonido, setSonido] = useState(sonidoActivo)
  const [vibracion, setVibracion] = useState(vibracionActiva)
  const volver = () => setModo(null)
  const g = leer()

  let contenido
  if (!entro) {
    contenido = (
      <main className="pantalla inicio" key="bienvenida">
        <h1 className="logo">ricota_quiz</h1>
        <p className="sub">Patricio Rey y sus Redonditos de Ricota</p>
        <button className="nueva entrar" onClick={() => setEntro(true)}>Entrar</button>
        <p className="aviso">Juego de fans, no oficial, sin relación con la banda.</p>
      </main>
    )
  } else if (verTutorial) {
    contenido = <Tutorial onTerminar={() => setVerTutorial(false)} />
  } else if (!jugadores) {
    contenido = (
      <main className="pantalla inicio" key="jugadores">
        <h1 className="logo">ricota_quiz</h1>
        <p className="sub">¿Cómo querés jugar?</p>
        <nav className="menu">
          <button className="modo" onClick={() => setJugadores('solo')}>
            <span>Un jugador<small>Practicá y sumá puntos</small></span>
          </button>
          <button className="modo" disabled>
            <span>Contra un amigo<small>Sala online: elegís juegos y temática</small></span>
            <em className="pronto">Próximamente</em>
          </button>
        </nav>
      </main>
    )
  } else if (modo === 'sopa') contenido = <SopaDeLetras onVolver={volver} />
  else if (modo === 'trivia') contenido = <Trivia onVolver={volver} />
  else if (modo === 'adivinanzas') contenido = <Adivinanzas onVolver={volver} />
  else if (modo === 'crucigrama') contenido = <Crucigrama onVolver={volver} />
  else if (modo === 'banda') contenido = <Trivia onVolver={volver} categoria="banda" />
  else {
    contenido = (
      <main className="pantalla inicio" key="menu">
        <h1 className="logo">ricota_quiz</h1>
        <p className="sub">Patricio Rey y sus Redonditos de Ricota</p>
        <nav className="menu">
          {MODOS.map((m) => (
            <button
              key={m.id}
              className="modo"
              disabled={!m.activo}
              onClick={() => setModo(m.id)}
            >
              <span>{m.nombre}{m.detalle && <small>{m.detalle}</small>}</span>
              {!m.activo && <em className="pronto">Próximamente</em>}
            </button>
          ))}
        </nav>
        <section className="stats">
          <div><b>{g.nivel}</b>Nivel trivia</div>
          <div><b>{g.mejor}/10</b>Mejor trivia</div>
          <div><b>{g.sopas}</b>Sopas hechas</div>
          <div><b>{g.adivinanzas}</b>Pts adivinanzas</div>
          <div><b>{g.nivelBanda}</b>Nivel banda</div>
          <div><b>{g.crucigramas}</b>Crucigramas</div>
        </section>
        <button className="secundario" onClick={() => setVerTutorial(true)}>Ayuda</button>
      </main>
    )
  }

  // clic sonoro en cualquier botón
  const alClic = (e) => {
    if (e.target.closest('button:not(:disabled)')) sonar('clic')
  }

  return (
    <div onClick={alClic}>
      {contenido}
      <div className="interruptores">
        <button
          className="sonido"
          onClick={() => setSonido(alternarSonido())}
          aria-label={sonido ? 'Silenciar efectos' : 'Activar efectos'}
          aria-pressed={sonido}
        >
          {sonido ? '🔊' : '🔇'}
        </button>
        {vibracionDisponible() && (
          <button
            className="sonido"
            onClick={() => setVibracion(alternarVibracion())}
            aria-label={vibracion ? 'Desactivar vibración' : 'Activar vibración'}
            aria-pressed={vibracion}
          >
            {vibracion ? '📳' : '📴'}
          </button>
        )}
      </div>
      {entro && <Musica />}
      <footer className="pie">Juego de fans, no oficial, sin relación con la banda.</footer>
    </div>
  )
}
