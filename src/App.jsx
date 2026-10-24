import { useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'
import Trivia from './Trivia.jsx'
import Adivinanzas from './Adivinanzas.jsx'
import { leer } from './storage.js'

const MODOS = [
  { id: 'sopa', nombre: 'Sopa de letras', activo: true },
  { id: 'trivia', nombre: 'Trivia', activo: true },
  { id: 'adivinanzas', nombre: 'Adivinanzas', activo: true },
  { id: 'crucigrama', nombre: 'Crucigrama', activo: false },
]

export default function App() {
  const [modo, setModo] = useState(null)
  const volver = () => setModo(null)
  const g = leer()

  let contenido
  if (modo === 'sopa') contenido = <SopaDeLetras onVolver={volver} />
  else if (modo === 'trivia') contenido = <Trivia onVolver={volver} />
  else if (modo === 'adivinanzas') contenido = <Adivinanzas onVolver={volver} />
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
        </section>
      </main>
    )
  }

  return (
    <>
      {contenido}
      <footer className="pie">Juego de fans, no oficial, sin relación con la banda.</footer>
    </>
  )
}
