import { useEffect, useRef, useState } from 'react'
import lista from './data/musica.json'
import { PLAYLIST_YOUTUBE } from './config.js'

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
export default function Musica() {
  const [abierto, setAbierto] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [fallo, setFallo] = useState(false)
  const contenedor = useRef(null)
  const player = useRef(null)
  const indice = useRef(0)
  const erroresSeguidos = useRef(0)

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

  useEffect(() => {
    if (!hayMusica || !abierto) return
    let cancelado = false
    document.body.classList.add('con-musica')
    cargarApi().then((YT) => {
      if (cancelado || !contenedor.current) return
      const destino = document.createElement('div')
      contenedor.current.appendChild(destino)
      const base = { autoplay: 1, playsinline: 1, rel: 0, origin: window.location.origin }
      const opciones = {
        width: 200,
        height: 200,
        // con lista de YouTube no se indica un video suelto (la API lo rechazaría)
        ...(PLAYLIST_YOUTUBE ? {} : { videoId: lista[0].youtubeId }),
        playerVars: PLAYLIST_YOUTUBE ? { ...base, listType: 'playlist', list: PLAYLIST_YOUTUBE } : base,
        events: {
          onReady: (e) => {
            if (PLAYLIST_YOUTUBE) e.target.setLoop(true) // bucle por toda la lista
            else setTitulo(lista[0].titulo)
            e.target.playVideo()
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              erroresSeguidos.current = 0
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
    })
    return () => {
      cancelado = true
      document.body.classList.remove('con-musica')
      try { player.current?.destroy() } catch { /* ya destruido */ }
      player.current = null
      if (contenedor.current) contenedor.current.innerHTML = ''
    }
  }, [abierto])

  if (!hayMusica || !abierto) return null

  const alternar = () => {
    const p = player.current
    if (!p?.getPlayerState) return
    if (p.getPlayerState() === 1) p.pauseVideo()
    else p.playVideo()
  }

  return (
    <aside className="musica" aria-label="Reproductor de música">
      <div ref={contenedor} className="musica-video" />
      <div className="musica-barra">
        <span className="musica-titulo">{fallo ? 'No se pudo reproducir' : titulo || 'Música'}</span>
        <button onClick={alternar} aria-label="Reproducir o pausar">⏯</button>
        <button onClick={siguiente} aria-label="Siguiente video">⏭</button>
        <button onClick={() => setAbierto(false)} aria-label="Cerrar reproductor">✕</button>
      </div>
    </aside>
  )
}
