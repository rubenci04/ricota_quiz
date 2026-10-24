import { useState } from 'react'
import datos from './data/datos-ricotero.json'
import { normalizar } from './sopa.js'
import { guardar, leer } from './storage.js'

const canciones = datos.canciones.filter((c) => c.palabras.length >= 3)
const soloLetras = (t) => normalizar(t).replace(/[^A-Z0-9]/g, '')

function nuevaRonda(anterior) {
  let c
  do {
    c = canciones[Math.floor(Math.random() * canciones.length)]
  } while (c === anterior && canciones.length > 1)
  const claves = [...c.palabras].sort(() => Math.random() - 0.5).slice(0, 3)
  return { cancion: c, claves }
}

export default function Adivinanzas({ onVolver }) {
  const [ronda, setRonda] = useState(() => nuevaRonda(null))
  const [pista, setPista] = useState(1)
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null) // { acierto, puntos }
  const [fallo, setFallo] = useState(false)
  const [total, setTotal] = useState(() => leer().adivinanzas)

  const { cancion, claves } = ronda
  const disco = datos.discos.find((d) => d.id === cancion.disco)
  const letras = soloLetras(cancion.titulo).length

  const enviar = (e) => {
    e.preventDefault()
    if (resultado || !texto.trim()) return
    if (soloLetras(texto) === soloLetras(cancion.titulo)) {
      const puntos = 4 - pista
      setTotal(guardar({ adivinanzas: leer().adivinanzas + puntos }).adivinanzas)
      setResultado({ acierto: true, puntos })
    } else {
      setFallo(true)
    }
  }

  const otra = () => {
    setRonda(nuevaRonda(cancion))
    setPista(1)
    setTexto('')
    setResultado(null)
    setFallo(false)
  }

  return (
    <main className="pantalla">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Adivinanzas</h2>
        <span className="contador">{total} pts</span>
      </header>

      <div className="pregunta">
        <p>Adiviná la canción</p>
        <ul className="lista">
          <li>Palabras: {claves.join(' · ')}</li>
          {pista >= 2 && <li>Disco: {disco.titulo} ({disco.anio})</li>}
          {pista >= 3 && <li>Empieza con «{cancion.titulo[0]}» · {letras} letras</li>}
        </ul>
      </div>

      {!resultado && (
        <>
          <form className="respuesta" onSubmit={enviar}>
            <input
              value={texto}
              onChange={(e) => { setTexto(e.target.value); setFallo(false) }}
              placeholder="Título de la canción"
              autoComplete="off"
            />
            <button className="nueva" type="submit">Probar</button>
          </form>
          {fallo && <p className="error">Ese no es. Probá de nuevo.</p>}
          {pista < 3 && (
            <button className="secundario" onClick={() => setPista(pista + 1)}>Siguiente pista</button>
          )}
          <button className="secundario" onClick={() => setResultado({ acierto: false, puntos: 0 })}>
            Me rindo
          </button>
        </>
      )}

      {resultado && (
        <>
          <div className="victoria">
            {resultado.acierto
              ? <><strong>¡Correcto!</strong> +{resultado.puntos} {resultado.puntos === 1 ? 'punto' : 'puntos'}</>
              : <>La respuesta era: <strong>{cancion.titulo}</strong></>}
          </div>
          <button className="nueva" onClick={otra}>Otra canción</button>
        </>
      )}
    </main>
  )
}
