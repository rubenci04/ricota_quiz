import { useEffect, useRef, useState } from 'react'
import Confeti from './Confeti.jsx'
import { URL_JUEGO } from './config.js'

// Pantalla final común: puntaje, mejor puntaje y botón para compartir.
// `compartir` es el texto corto (sin letras ni versos); la URL sale de config.js.
export default function Resultado({ titulo, puntaje, detalle, mejor, mensaje, compartir, exito = true, alMostrar, children }) {
  const [estado, setEstado] = useState('')
  const avisado = useRef(false)

  useEffect(() => {
    if (avisado.current) return
    avisado.current = true
    alMostrar?.()
  }, [alMostrar])

  // copia con la API moderna y, si el navegador la rechaza, con un textarea temporal
  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto)
      return true
    } catch {
      const area = document.createElement('textarea')
      area.value = texto
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      let ok = false
      try { ok = document.execCommand('copy') } catch { ok = false }
      area.remove()
      return ok
    }
  }

  const compartirResultado = async () => {
    const texto = `${compartir} ${URL_JUEGO}`
    try {
      if (navigator.share) {
        await navigator.share({ text: compartir, url: URL_JUEGO })
        setEstado('✓ Compartido')
        return
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
    setEstado((await copiar(texto)) ? '✓ Copiado al portapapeles' : `✗ No se pudo copiar. Copialo a mano: ${texto}`)
  }

  return (
    <section className="resultado" aria-label="Resultado">
      {exito && <Confeti />}
      <h2 className="resultado-titulo">{titulo}</h2>
      <p className="resultado-puntaje">{puntaje}</p>
      {detalle && <p className="resultado-detalle">{detalle}</p>}
      {mejor && (
        <p className="resultado-mejor">
          {mejor.etiqueta}: <strong>{mejor.valor}</strong>
        </p>
      )}
      {mensaje && <p className="resultado-mensaje">{mensaje}</p>}
      <button className="secundario" onClick={compartirResultado}>Compartir</button>
      <p className="feedback" role="status" aria-live="polite">{estado}</p>
      {children}
    </section>
  )
}
