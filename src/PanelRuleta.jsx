import { useState } from 'react'
import Ruleta from './Ruleta.jsx'

// Ruleta de categorías: el azar elige y el juego sigue con lo que salió.
// categorias: [{ id, texto, icono, color }]. onElegida(id) se llama al frenar la ruleta.
export default function PanelRuleta({ titulo, categorias, onElegida, textoBoton = '🎡 ¡Girar la ruleta!', nota }) {
  const [salio, setSalio] = useState(null)
  return (
    <section className="panel-ruleta" aria-label={titulo}>
      <h3 className="rt-titulo">{titulo}</h3>
      {nota && <p className="rt-nota">{nota}</p>}
      <Ruleta
        titulo={titulo}
        etiquetas={categorias.map((c) => ({ texto: c.texto, icono: c.icono, color: c.color }))}
        textoBoton={salio ? '🎡 Girar de nuevo' : textoBoton}
        onResultado={(idx) => {
          setSalio(categorias[idx])
          onElegida(categorias[idx].id, categorias[idx])
        }}
      />
      {salio && (
        <p className="rt-resultado" role="status" style={{ '--rc': salio.color }}>
          <span aria-hidden="true">{salio.icono}</span> ¡Salió <strong>{salio.texto}</strong>!
        </p>
      )}
    </section>
  )
}
