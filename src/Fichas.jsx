import { useState } from 'react'

// Grupo de fichas (o tarjetas) para elegir. Cada opción: { id, etiqueta, icono, color, detalle, deshabilitada }.
// Al tocar una ficha se marca con una pequeña animación y se avisa con onElegir.
export default function Fichas({ opciones, valor, onElegir, nombre, tarjetas = false }) {
  const [tocada, setTocada] = useState(null)
  return (
    <div className={`fichas${tarjetas ? ' tarjetas' : ''}`} role="group" aria-label={nombre}>
      {opciones.map((o) => (
        <button
          key={o.id}
          className={`ficha${valor === o.id ? ' elegida' : ''}${tocada === o.id ? ' tocada' : ''}`}
          style={o.color ? { '--c': o.color } : undefined}
          disabled={o.deshabilitada}
          aria-pressed={valor === o.id}
          onClick={() => {
            setTocada(o.id)
            onElegir(o.id)
          }}
        >
          {o.icono && <span className="ficha-icono" aria-hidden="true">{o.icono}</span>}
          <span>
            {o.etiqueta}
            {o.detalle && <small>{o.detalle}</small>}
          </span>
        </button>
      ))}
    </div>
  )
}
