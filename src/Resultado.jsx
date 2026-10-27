import { useEffect, useRef, useState } from 'react'
import Bonus from './Bonus.jsx'
import { registrarBonusPartida } from './bonus.js'
import Confeti from './Confeti.jsx'
import { Contador } from './Animados.jsx'
import { NOMBRE_JUEGO, URL_JUEGO } from './config.js'
import { MODOS_DESAFIO, comparar, crearLink, textoDesafio } from './desafio.js'

// Pantalla final común: puntaje, mejor puntaje, compartir y desafiar a un amigo.
// `compartir` es el texto corto (sin letras ni versos); la URL sale de config.js.
// `desafio` ({modo, tema, dif, semilla, puntaje}) habilita "Desafiar a un amigo".
// `rival` ({puntaje}) aparece cuando se juega un desafío recibido: compara los dos puntajes.
export default function Resultado({ titulo, puntaje, detalle, mejor, mensaje, compartir, exito = true, alMostrar, desafio, rival, bonus, canciones = [], children }) {
  const [estado, setEstado] = useState('')
  const avisado = useRef(false)

  useEffect(() => {
    if (avisado.current) return
    avisado.current = true
    alMostrar?.()
    if (bonus) registrarBonusPartida(bonus)
    else if (desafio) registrarBonusPartida({ clave: [desafio.modo,desafio.semilla,desafio.nivel??desafio.ronda??desafio.disco??'todos'].join(':'), modo:desafio.modo==='adivinanzas'?(desafio.ronda==='palabras'?'palabras':'dicho'):desafio.modo, buenResultado:exito, canciones, puntos:Number.parseInt(puntaje)||0 })
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

  const enviar = async (texto, url) => {
    try {
      if (navigator.share) {
        await navigator.share({ text: texto, url })
        setEstado('✓ Compartido')
        return
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
    const completo = `${texto}\n${url}`
    setEstado((await copiar(completo)) ? '✓ Copiado al portapapeles' : `✗ No se pudo copiar. Copialo a mano: ${completo}`)
  }

  const compartirResultado = () => enviar(`${compartir} (${NOMBRE_JUEGO})`, URL_JUEGO)
  const desafiar = () => enviar(textoDesafio(desafio), crearLink(desafio))

  const m = desafio ? MODOS_DESAFIO[desafio.modo] : null
  const veredicto = rival && desafio ? comparar(desafio.puntaje, rival.puntaje) : null

  return (
    <section className="resultado" aria-label="Resultado">
      {exito && <Confeti />}
      <h2 className="resultado-titulo">{titulo}</h2>
      <p className="resultado-puntaje"><Contador valor={puntaje} /></p>
      {detalle && <p className="resultado-detalle">{detalle}</p>}
      {mejor && (
        <p className="resultado-mejor">
          {mejor.etiqueta}: <strong>{mejor.valor}</strong>
        </p>
      )}
      {veredicto && (
        <div className={`comparacion ${veredicto}`} role="status">
          <p>Tu amigo hizo <strong>{m.formato(rival.puntaje)}</strong> · vos hiciste <strong>{m.formato(desafio.puntaje)}</strong></p>
          <p className="comparacion-veredicto">
            {veredicto === 'gana' && '🏆 ¡Le ganaste! Se lo merecía.'}
            {veredicto === 'empata' && '🤝 Empate técnico. ¿Revancha?'}
            {veredicto === 'pierde' && '😅 Esta vez ganó tu amigo. ¡Pedí la revancha!'}
          </p>
        </div>
      )}
      {mensaje && <p className="resultado-mensaje">{mensaje}</p>}
      <button className="secundario" onClick={compartirResultado}>Compartir</button>
      {desafio && <button className="secundario" onClick={desafiar}>Desafiar a un amigo</button>}
      <p className="feedback" role="status" aria-live="polite">{estado}</p>
      {(desafio||bonus) && <Bonus />}
      {children}
    </section>
  )
}
