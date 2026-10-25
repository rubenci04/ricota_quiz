import { useEffect, useRef, useState } from 'react'
import datos from './data/datos-ricotero.json'
import { guardar, leer } from './storage.js'
import { normalizarLetras } from './letras.js'
import Teclado from './Teclado.jsx'
import Resultado from './Resultado.jsx'
import { sonar } from './sonido.js'
import { frase } from './textos.js'

const MAX_ERRORES = 8
const MAX_PISTAS = 2
const ERRORES_PARA_DISCO = 3
const normalizarAhorcado = normalizarLetras

// Solo canciones con palabras verificadas.
const pares = datos.canciones
  .filter((c) => c.palabras_verificadas)
  .flatMap((c) =>
    c.palabras
      .filter((p) => normalizarAhorcado(p).length >= 4)
      .map((p) => ({ original: p, clave: normalizarAhorcado(p), cancion: c.titulo, disco: c.disco })),
  )

const nuevaPalabra = () => pares[Math.floor(Math.random() * pares.length)]

// Las luces del escenario: cada error apaga una. Cuando se apagan todas, se termina la función.
function Luces({ errores }) {
  const restantes = MAX_ERRORES - errores
  return (
    <svg viewBox="0 0 240 80" className="luces" role="img" aria-label={`${restantes} luces encendidas de ${MAX_ERRORES}`}>
      <rect x="6" y="10" width="228" height="6" rx="3" fill="currentColor" opacity="0.5" />
      {Array.from({ length: MAX_ERRORES }, (_, i) => {
        const encendida = i < restantes
        const x = 20 + i * 29.4
        return (
          <g key={i}>
            <rect x={x - 3} y="16" width="6" height="10" fill="currentColor" opacity="0.5" />
            <circle
              cx={x}
              cy="38"
              r="11"
              fill={encendida ? '#e0a526' : 'none'}
              stroke={encendida ? '#e0a526' : '#8a867c'}
              strokeWidth="3"
              className={encendida ? 'luz-encendida' : 'luz-apagada'}
            />
            {encendida && <path d={`M${x - 10} 52 L${x - 18} 74 H${x + 18} L${x + 10} 52 Z`} fill="#e0a526" opacity="0.12" />}
          </g>
        )
      })}
    </svg>
  )
}

export default function Ahorcado({ onVolver }) {
  const [palabra, setPalabra] = useState(nuevaPalabra)
  const [usadas, setUsadas] = useState([])
  const [pistas, setPistas] = useState(0)
  const [mensaje, setMensaje] = useState('')
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
    const completa = [...palabra.clave].every((x) => nuevas.includes(x))
    if (!palabra.clave.includes(l)) {
      sonar('error')
      setMensaje(`✗ No hay «${l}». Quedan ${MAX_ERRORES - nErrores} luces. ${frase('error')}`)
    } else if (!completa) {
      sonar('ok')
      setMensaje(`✓ Hay «${l}». ${frase('acierto')}`)
    } else {
      setMensaje('✓ ¡Completaste la palabra!')
    }
    if (completa || nErrores >= MAX_ERRORES) {
      const e = leer()
      setRacha(guardar({ racha: completa ? e.racha + 1 : 0, partidas: e.partidas + 1 }).racha)
    }
  }

  const pedirPista = () => {
    if (pistas >= MAX_PISTAS || terminada) return
    const faltan = [...new Set(palabra.clave)].filter((l) => !usadas.includes(l))
    if (!faltan.length) return
    setPistas(pistas + 1)
    probar(faltan[Math.floor(Math.random() * faltan.length)])
    sonar('pista')
  }

  const otra = () => {
    setPalabra(nuevaPalabra())
    setUsadas([])
    setPistas(0)
    setMensaje('')
  }

  // teclado físico: el manejador vigente se actualiza en cada render
  const acciones = useRef(null)
  useEffect(() => {
    const alTecla = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return
      acciones.current?.(e)
    }
    window.addEventListener('keydown', alTecla)
    return () => window.removeEventListener('keydown', alTecla)
  }, [])
  acciones.current = (e) => {
    if (e.key.length === 1 && /\p{L}/u.test(e.key)) {
      const l = normalizarLetras(e.key)
      if (/^[A-ZÑ]$/.test(l)) probar(l)
    }
  }

  const disco = datos.discos.find((d) => d.id === palabra.disco)

  return (
    <main className="pantalla" key="ahorcado">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Ahorcado</h2>
        <span className="contador">Racha {racha}</span>
      </header>

      <p className="tema">de la canción «{palabra.cancion}» · {palabra.clave.length} letras</p>
      {errores >= ERRORES_PARA_DISCO && (
        <p className="tema datos-disco">Disco: {disco.titulo} ({disco.anio})</p>
      )}

      <Luces errores={errores} />

      <div className="palabra" aria-label="Palabra oculta">
        {[...palabra.clave].map((l, i) => (
          <span key={i} className={!usadas.includes(l) && perdida ? 'perdida' : ''}>
            {usadas.includes(l) || perdida ? l : ''}
          </span>
        ))}
      </div>

      <p className="feedback" role="status" aria-live="polite">{mensaje}</p>

      {terminada ? (
        <Resultado
          titulo="Ahorcado"
          puntaje={`${MAX_ERRORES - Math.min(errores, MAX_ERRORES)}/${MAX_ERRORES}`}
          detalle={`${acertada ? 'Acertaste' : 'Se apagaron las luces'}: era «${palabra.original}» (de «${palabra.cancion}»)`}
          mejor={{ etiqueta: 'Racha de aciertos', valor: racha }}
          mensaje={acertada ? frase('victoria') : frase('derrota')}
          exito={acertada}
          compartir={`Resolví una palabra ricotera con ${MAX_ERRORES - errores} luces de sobra 🎸 ¿Podés superarme?`}
        >
          <button className="nueva" onClick={otra}>Otra palabra</button>
        </Resultado>
      ) : (
        <>
          <Teclado
            onTecla={probar}
            usada={(l) => usadas.includes(l)}
            estado={(l) => (usadas.includes(l) ? (palabra.clave.includes(l) ? ' ok' : ' mal') : '')}
          />
          <button className="secundario" onClick={pedirPista} disabled={pistas >= MAX_PISTAS}>
            Pista ({MAX_PISTAS - pistas})
          </button>
        </>
      )}
    </main>
  )
}
