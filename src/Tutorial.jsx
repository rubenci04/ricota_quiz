import { useState } from 'react'
import { guardar } from './storage.js'
import { NOMBRE_JUEGO } from './config.js'

const TARJETAS = [
  {
    titulo: `¿Qué es ${NOMBRE_JUEGO}?`,
    texto: 'Un juego de fans para jugar con la cultura ricotera: sopa de letras, trivia, crucigrama y adivinanzas. Es no oficial y no tiene relación con la banda.',
  },
  {
    titulo: 'Cómo se juega',
    texto: 'Elegí un modo, usá las pistas cuando te trabes y sumá puntos. Cada modo guarda tu progreso en este dispositivo.',
  },
  {
    titulo: 'Casual o Fanático',
    texto: 'Casual te da más ayudas y datos. Fanático es para los que saben: menos pistas y más desafío. Podés cambiarlo cuando quieras.',
  },
]

export default function Tutorial({ onTerminar }) {
  const [paso, setPaso] = useState(0)
  const tarjeta = TARJETAS[paso]
  const ultima = paso === TARJETAS.length - 1

  const terminar = (dificultad) => {
    guardar(dificultad ? { tutorial: true, dificultad } : { tutorial: true })
    onTerminar()
  }

  return (
    <main className="pantalla inicio" key="tutorial">
      <p className="pasos" aria-label={`Tarjeta ${paso + 1} de ${TARJETAS.length}`}>
        {TARJETAS.map((_, i) => (
          <span key={i} className={i === paso ? 'punto activo' : 'punto'} aria-hidden="true" />
        ))}
      </p>
      <article className="tarjeta" key={paso}>
        <h2>{tarjeta.titulo}</h2>
        <p>{tarjeta.texto}</p>
      </article>
      {ultima ? (
        <div className="menu">
          <button className="modo" onClick={() => terminar('casual')}>
            <span>Casual<small>Más ayudas y datos desde el inicio</small></span>
          </button>
          <button className="modo" onClick={() => terminar('fanatico')}>
            <span>Fanático<small>Menos pistas, más desafío</small></span>
          </button>
        </div>
      ) : (
        <button className="nueva" onClick={() => setPaso(paso + 1)}>Siguiente</button>
      )}
      {!ultima && <button className="secundario" onClick={() => terminar()}>Saltar</button>}
    </main>
  )
}
