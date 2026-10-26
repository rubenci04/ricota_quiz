import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import lista from './data/musica.json'
import { PLAYLIST_YOUTUBE } from './config.js'
import { guardar, leer } from './storage.js'

const PASO_VOLUMEN = 10

const ERRORES_DE_INCRUSTACION = [100, 101, 150] // el video no existe o no permite incrustarse
let apiLista = null

function cargarApi() {
  if (apiLista) return apiLista
  apiLista = new Promise((resolver) => {
    if (window.YT?.Player) return resolver(window.YT)
    const previa = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previa?.()
      resolver(window.YT)
    }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(s)
  })
  return apiLista
}

// Fuente de música: una lista de YouTube (config.js) o, si no hay, los videos de src/data/musica.json.
const hayMusica = Boolean(PLAYLIST_YOUTUBE) || lista.length > 0

// Mini reproductor visible (mínimo 200x200) con controles propios. Se cierra, no se esconde.
export default function Musica({ controlRef }) {
  const [abierto, setAbierto] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [fallo, setFallo] = useState(false)
  const contenedor = useRef(null)
  const player = useRef(null)
  const indice = useRef(0)
  const erroresSeguidos = useRef(0)
  const [volumen, setVolumen] = useState(() => leer().volumen) // arranca en 30%
  const volumenActual = useRef(volumen) // para usarlo dentro de los eventos del reproductor
  const gesto = useRef(false) // ya hubo una interacción: se puede sacar el silencio
  const arrancando = useRef(false) // ya se cargó la lista desde un video al azar
  const barajado = useRef(false) // ya se activó el orden aleatorio

  // pasa al siguiente video (en bucle)
  const siguiente = () => {
    const p = player.current
    if (!p) return
    if (PLAYLIST_YOUTUBE) {
      p.nextVideo()
    } else {
      indice.current = (indice.current + 1) % lista.length
      setTitulo(lista[indice.current].titulo)
      p.loadVideoById(lista[indice.current].youtubeId)
    }
  }

  // Espera a que la lista esté cargada, lee cuántos videos tiene y la arranca desde uno elegido al azar.
  const empezarAlAzar = (p, cancelado) => {
    let intentos = 0
    const esperar = () => {
      if (cancelado()) return
      const ids = p.getPlaylist?.()
      if (Array.isArray(ids) && ids.length > 0) {
        arrancando.current = true
        p.loadPlaylist({ listType: 'playlist', list: PLAYLIST_YOUTUBE, index: Math.floor(Math.random() * ids.length), startSeconds: 0 })
      } else if (++intentos < 50) {
        setTimeout(esperar, 200)
      } else {
        // plan B: no se pudo leer la lista; arranca desde el principio pero igual barajada
        arrancando.current = true
        p.playVideo()
      }
    }
    esperar()
  }

  useEffect(() => {
    if (!hayMusica || !abierto) return
    let cancelado = false
    document.body.classList.add('con-musica')
    cargarApi().then((YT) => {
      if (cancelado || !contenedor.current) return
      const destino = document.createElement('div')
      contenedor.current.appendChild(destino)
      // con lista de YouTube no se autoarranca: se espera a leer la lista para empezar desde un video al azar
      const base = { autoplay: PLAYLIST_YOUTUBE ? 0 : 1, mute: 1, playsinline: 1, rel: 0, origin: window.location.origin }
      const opciones = {
        width: 200,
        height: 200,
        // con lista de YouTube no se indica un video suelto (la API lo rechazaría)
        ...(PLAYLIST_YOUTUBE ? {} : { videoId: lista[0].youtubeId }),
        playerVars: PLAYLIST_YOUTUBE ? { ...base, listType: 'playlist', list: PLAYLIST_YOUTUBE } : base,
        events: {
          onReady: (e) => {
            // arranca silenciado (los navegadores bloquean el audio antes de una interacción)
            if (!gesto.current) e.target.mute()
            e.target.setVolume(volumenActual.current)
            if (PLAYLIST_YOUTUBE) {
              empezarAlAzar(e.target, () => cancelado)
            } else {
              setTitulo(lista[0].titulo)
              e.target.playVideo()
            }
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              erroresSeguidos.current = 0
              e.target.setVolume(volumenActual.current) // en cada cambio de video
              if (gesto.current && volumenActual.current > 0) e.target.unMute()
              // setShuffle solo funciona con la lista ya cargada: se activa en la primera reproducción
              if (PLAYLIST_YOUTUBE && arrancando.current && !barajado.current) {
                barajado.current = true
                e.target.setShuffle(true)
                e.target.setLoop(true)
              }
              const datos = e.target.getVideoData?.()
              if (PLAYLIST_YOUTUBE && datos?.title) setTitulo(datos.title)
            }
            if (e.data === YT.PlayerState.ENDED && !PLAYLIST_YOUTUBE) siguiente() // bucle por la lista local
          },
          onError: (e) => {
            if (!ERRORES_DE_INCRUSTACION.includes(e.data) && e.data !== 2 && e.data !== 5) return
            erroresSeguidos.current += 1
            const total = PLAYLIST_YOUTUBE ? e.target.getPlaylist?.()?.length || 1 : lista.length
            if (erroresSeguidos.current >= total) setFallo(true)
            else siguiente()
          },
        },
      }
      player.current = new YT.Player(destino, opciones)
      if (import.meta.env.DEV) window.__playerMusica = player.current // solo para probar en desarrollo
    })
    return () => {
      cancelado = true
      document.body.classList.remove('con-musica')
      try { player.current?.stopVideo?.(); player.current?.destroy() } catch { /* ya destruido */ }
      player.current = null
      if (contenedor.current) contenedor.current.innerHTML = ''
    }
  }, [abierto])

  // el primer toque, clic o tecla en cualquier parte de la página saca el silencio (una sola vez)
  useEffect(() => {
    if (!hayMusica) return undefined
    const eventos = ['pointerdown', 'touchstart', 'keydown']
    const quitar = () => eventos.forEach((n) => window.removeEventListener(n, alGesto, true))
    function alGesto() {
      gesto.current = true
      quitar()
      const p = player.current
      try {
        p?.setVolume?.(volumenActual.current)
        if (volumenActual.current > 0) p?.unMute?.()
        if (p?.getPlayerState?.() !== 1 && p?.getPlayerState?.() !== 3) p?.playVideo?.()
      } catch { /* el reproductor todavía no está listo: se destapa al empezar */ }
    }
    eventos.forEach((n) => window.addEventListener(n, alGesto, true))
    return quitar
  }, [])

  // cambia el volumen (0–100), lo aplica al reproductor y lo guarda
  const cambiarVolumen = (delta) => {
    const nuevo = Math.min(100, Math.max(0, volumen + delta))
    setVolumen(nuevo)
    volumenActual.current = nuevo
    player.current?.setVolume?.(nuevo)
    if (nuevo > 0) player.current?.unMute?.()
    guardar({ volumen: nuevo })
  }

  const alternar = () => {
    const p = player.current
    if (!p?.getPlayerState) return
    if (p.getPlayerState() === 1) p.pauseVideo()
    else p.playVideo()
  }

  useImperativeHandle(controlRef, () => ({ alternar, siguiente }))
  if (!hayMusica || !abierto) return null

  return (
    <aside className="musica" aria-label="Reproductor de música">
      <div ref={contenedor} className="musica-video" />
      <div className="musica-volumen" role="group" aria-label="Volumen de la música">
        <button onClick={() => cambiarVolumen(-PASO_VOLUMEN)} aria-label="Bajar el volumen" disabled={volumen <= 0}>−</button>
        <output aria-live="polite">🔊 {volumen}%</output>
        <button onClick={() => cambiarVolumen(PASO_VOLUMEN)} aria-label="Subir el volumen" disabled={volumen >= 100}>+</button>
      </div>
      <div className="musica-barra">
        <span className="musica-titulo">{fallo ? 'No se pudo reproducir' : titulo || 'Música'}</span>
        <button onClick={alternar} aria-label="Reproducir o pausar">⏯</button>
        <button onClick={siguiente} aria-label="Siguiente video">⏭</button>
        <button onClick={() => setAbierto(false)} aria-label="Cerrar reproductor">✕</button>
      </div>
    </aside>
  )
}
