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
    titulo: 'Casual o Ricotero',
    texto: 'Casual te da más ayudas y datos. Ricotero es para fanáticos: menos pistas y más desafío. Cada juego empieza en Casual; podés cambiarlo al entrar.',
  },
]

export default function Tutorial({ onTerminar, estadoFondo }) {
  const [paso, setPaso] = useState(0)
  const tarjeta = TARJETAS[paso]
  const ultima = paso === TARJETAS.length - 1

  const terminar = () => {
    guardar({ tutorial: true, dificultad: 'casual' })
    onTerminar()
  }

  return (
    <main className="pantalla inicio" key="tutorial">
      <p role="status">Fondo: {estadoFondo}</p>
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
          <button className="modo" onClick={terminar}>
            <span>Empezar en Casual<small>Ricotero está disponible dentro de cada juego</small></span>
          </button>
        </div>
      ) : (
        <button className="nueva" onClick={() => setPaso(paso + 1)}>Siguiente</button>
      )}
      {!ultima && <button className="secundario" onClick={() => terminar()}>Saltar</button>}
    </main>
  )
}
