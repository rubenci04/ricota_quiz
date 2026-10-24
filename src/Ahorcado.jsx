import { useState } from 'react'
import datos from './data/datos-ricotero.json'
import { guardar, leer } from './storage.js'
import { normalizarLetras } from './letras.js'
import Teclado from './Teclado.jsx'

const MAX_ERRORES = 6
const normalizarAhorcado = normalizarLetras

const pares = datos.canciones.flatMap((c) =>
  c.palabras
    .filter((p) => normalizarAhorcado(p).length >= 4)
    .map((p) => ({ original: p, clave: normalizarAhorcado(p), cancion: c.titulo })),
)

function nuevaPalabra() {
  return pares[Math.floor(Math.random() * pares.length)]
}

function Dibujo({ errores }) {
  const p = { stroke: 'currentColor', strokeWidth: 4, strokeLinecap: 'round', fill: 'none' }
  return (
    <svg viewBox="0 0 120 140" className="dibujo" role="img" aria-label={`${errores} errores de ${MAX_ERRORES}`}>
      <path {...p} d="M10 130 H80 M30 130 V10 H85 V25" />
      {errores > 0 && <circle {...p} cx="85" cy="38" r="13" />}
      {errores > 1 && <path {...p} d="M85 51 V90" />}
      {errores > 2 && <path {...p} d="M85 60 L68 78" />}
      {errores > 3 && <path {...p} d="M85 60 L102 78" />}
      {errores > 4 && <path {...p} d="M85 90 L70 115" />}
      {errores > 5 && <path {...p} d="M85 90 L100 115" />}
    </svg>
  )
}

export default function Ahorcado({ onVolver }) {
  const [palabra, setPalabra] = useState(nuevaPalabra)
  const [usadas, setUsadas] = useState([])
  const [racha, setRacha] = useState(() => leer().racha)

  const errores = usadas.filter((l) => !palabra.clave.includes(l)).length
  const acertada = [...palabra.clave].every((l) => usadas.includes(l))
  const perdida = errores >= MAX_ERRORES
  const terminada = acertada || perdida

  const probar = (l) => {
    if (terminada || usadas.includes(l)) return
    const nuevas = [...usadas, l]
    setUsadas(nuevas)
    const nErrores = nuevas.filter((x) => !palabra.clave.includes(x)).length
    if ([...palabra.clave].every((x) => nuevas.includes(x))) {
      setRacha(guardar({ racha: leer().racha + 1 }).racha)
    } else if (nErrores >= MAX_ERRORES) {
      setRacha(guardar({ racha: 0 }).racha)
    }
  }

  const otra = () => {
    setPalabra(nuevaPalabra())
    setUsadas([])
  }

  return (
    <main className="pantalla">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Ahorcado</h2>
        <span className="contador">Racha {racha}</span>
      </header>

      <p className="tema">de la canción «{palabra.cancion}» · {palabra.clave.length} letras</p>

      <Dibujo errores={errores} />

      <div className="palabra" aria-label="Palabra oculta">
        {[...palabra.clave].map((l, i) => (
          <span key={i} className={!usadas.includes(l) && perdida ? 'perdida' : ''}>
            {usadas.includes(l) || perdida ? l : ''}
          </span>
        ))}
      </div>

      {terminada ? (
        <>
          <div className="victoria">
            {acertada ? <strong>¡Acertaste!</strong> : <>Perdiste. La palabra era: </>}
            {' '}<strong>{palabra.original}</strong>
          </div>
          <button className="nueva" onClick={otra}>Otra palabra</button>
        </>
      ) : (
        <Teclado
          onTecla={probar}
          usada={(l) => usadas.includes(l)}
          estado={(l) => (usadas.includes(l) ? (palabra.clave.includes(l) ? ' ok' : ' mal') : '')}
        />
      )}
    </main>
  )
}
