import { useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'
import Trivia from './Trivia.jsx'
import Adivinanzas from './Adivinanzas.jsx'
import Crucigrama from './Crucigrama.jsx'
import Ahorcado from './Ahorcado.jsx'
import Musica from './Musica.jsx'
import { alternarSonido, sonar, sonidoActivo } from './sonido.js'
import { leer } from './storage.js'

const MODOS = [
  { id: 'sopa', nombre: 'Sopa de letras', activo: true },
  { id: 'trivia', nombre: 'Trivia', activo: true },
  { id: 'adivinanzas', nombre: 'Adivinanzas', activo: true },
  { id: 'crucigrama', nombre: 'Crucigrama', activo: true },
  { id: 'ahorcado', nombre: 'Ahorcado', activo: true },
]

export default function App() {
  const [entro, setEntro] = useState(false)
  const [modo, setModo] = useState(null)
  const [sonido, setSonido] = useState(sonidoActivo)
  const volver = () => setModo(null)
  const g = leer()

  let contenido
  if (!entro) {
    contenido = (
      <main className="pantalla inicio">
        <h1 className="logo">ricota_quiz</h1>
        <p className="sub">Patricio Rey y sus Redonditos de Ricota</p>
        <button className="nueva entrar" onClick={() => setEntro(true)}>Entrar</button>
        <p className="aviso">Juego de fans, no oficial, sin relación con la banda.</p>
      </main>
    )
  } else if (modo === 'sopa') contenido = <SopaDeLetras onVolver={volver} />
  else if (modo === 'trivia') contenido = <Trivia onVolver={volver} />
  else if (modo === 'adivinanzas') contenido = <Adivinanzas onVolver={volver} />
  else if (modo === 'crucigrama') contenido = <Crucigrama onVolver={volver} />
  else if (modo === 'ahorcado') contenido = <Ahorcado onVolver={volver} />
  else {
    contenido = (
      <main className="pantalla inicio">
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
              <span>{m.nombre}</span>
              {!m.activo && <em className="pronto">Próximamente</em>}
            </button>
          ))}
        </nav>
        <section className="stats">
          <div><b>{g.nivel}</b>Nivel trivia</div>
          <div><b>{g.mejor}/10</b>Mejor trivia</div>
          <div><b>{g.sopas}</b>Sopas hechas</div>
          <div><b>{g.adivinanzas}</b>Pts adivinanzas</div>
          <div><b>{g.racha}</b>Racha ahorcado</div>
        </section>
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
      <button
        className="sonido"
        onClick={() => setSonido(alternarSonido())}
        aria-label={sonido ? 'Silenciar efectos' : 'Activar efectos'}
        aria-pressed={sonido}
      >
        {sonido ? '🔊' : '🔇'}
      </button>
      {entro && <Musica />}
      <footer className="pie">Juego de fans, no oficial, sin relación con la banda.</footer>
    </div>
  )
}
