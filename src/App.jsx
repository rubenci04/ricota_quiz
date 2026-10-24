import { useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'
import Trivia from './Trivia.jsx'
import { leer } from './storage.js'

const MODOS = [
  { id: 'sopa', nombre: 'Sopa de letras', activo: true },
  { id: 'trivia', nombre: 'Trivia', activo: true },
  { id: 'crucigrama', nombre: 'Crucigrama', activo: false },
]

export default function App() {
  const [modo, setModo] = useState(null)

  if (modo === 'sopa') return <SopaDeLetras onVolver={() => setModo(null)} />
  if (modo === 'trivia') return <Trivia onVolver={() => setModo(null)} />

  const g = leer()

  return (
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
        <div><b>{g.mejor}/10</b>Mejor puntaje</div>
        <div><b>{g.sopas}</b>Sopas hechas</div>
      </section>
    </main>
  )
}
