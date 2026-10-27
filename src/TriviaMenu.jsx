import { useState } from 'react'
import Trivia from './Trivia.jsx'
export default function TriviaMenu(props) {
  const [categoria, setCategoria] = useState('general')
  const selector = (
    <div className="segmentado" role="group" aria-label="Categoría de trivia">
      {[['general', 'Trivia general'], ['banda', 'La banda']].map(([id, texto]) => (
        <button key={id} aria-pressed={categoria === id} onClick={() => setCategoria(id)}>{texto}</button>
      ))}
    </div>
  )
  return <Trivia key={categoria} {...props} categoria={categoria} selector={selector} />
}
