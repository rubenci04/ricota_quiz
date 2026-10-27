import { useEffect, useRef, useState } from 'react'
import { iniciarFondo } from './fondo.js'

// Canvas fijo detrás de toda la interfaz. Sin canvas cuando el interruptor está apagado.
export default function Fondo({ activo, forzado = false, onEstado }) {
  const canvas = useRef(null)
  const [respaldo, setRespaldo] = useState(false)
  const [reducido, setReducido] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media=window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const cambio=()=>setReducido(media.matches)
    media?.addEventListener('change',cambio)
    return ()=>media?.removeEventListener('change',cambio)
  }, [])
  const estatico = reducido && !forzado
  useEffect(() => {
    if (!activo) { onEstado('animación desactivada por vos'); return undefined }
    onEstado(estatico ? 'reducir movimiento del sistema' : 'activo (0 fps)')
    if (respaldo || !canvas.current) return undefined
    const elemento=canvas.current
    const fallo=()=>setRespaldo(true)
    elemento.addEventListener('contextlost',fallo)
    try {
      const detener=iniciarFondo(elemento, { estatico, onEstado, onFallo: fallo })
      return ()=>{detener();elemento.removeEventListener('contextlost',fallo)}
    }
    catch { setRespaldo(true); return undefined }
  }, [activo, estatico, respaldo, onEstado])
  useEffect(() => {
    if (!respaldo || !activo || estatico) return undefined
    let frame, inicio = performance.now(), n = 0
    const medir = t => {
      n++
      if(t-inicio>=1500){const fps=Math.round(n*1000/(t-inicio));onEstado(fps<15?'ahorro de energía o rendimiento bajo':`activo (${fps} fps)`);inicio=t;n=0}
      frame=requestAnimationFrame(medir)
    }
    const visibilidad=()=>{
      cancelAnimationFrame(frame)
      if(document.hidden){onEstado('ahorro de energía o rendimiento bajo');return}
      inicio=performance.now();n=0;frame=requestAnimationFrame(medir)
    }
    document.addEventListener('visibilitychange',visibilidad)
    visibilidad()
    return ()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibilidad)}
  }, [respaldo, activo, estatico, onEstado])
  if (!activo) return null
  if (respaldo) return <div className="fondo-respaldo" data-estatico={estatico} aria-hidden="true"><i/><i/><i/></div>
  return <canvas ref={canvas} className="fondo-animado" aria-hidden="true" />
}
