import { useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'

const MODOS = [
  { id: 'sopa', nombre: 'Sopa de letras', activo: true },
  { id: 'trivia', nombre: 'Trivia', activo: false },
  { id: 'crucigrama', nombre: 'Crucigrama', activo: false },
]

export default function App() {
  const [modo, setModo] = useState(null)

  if (modo === 'sopa') return <SopaDeLetras onVolver={() => setModo(null)} />

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
    </main>
  )
}
