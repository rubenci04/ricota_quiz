import { useEffect, useRef, useState } from 'react'
import lista from './data/musica.json'

const ERRORES_DE_INCRUSTACION = [100, 101, 150]
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

// Mini reproductor visible (mínimo 200x200) con controles propios. Se cierra, no se esconde.
export default function Musica() {
  const [abierto, setAbierto] = useState(true)
  const [actual, setActual] = useState(0)
  const [fallo, setFallo] = useState(false)
  const contenedor = useRef(null)
  const player = useRef(null)
  const indice = useRef(0)
  const erroresSeguidos = useRef(0)

  const reproducir = (i) => {
    indice.current = i
    setActual(i)
    player.current?.loadVideoById(lista[i].youtubeId)
  }
  const siguiente = () => reproducir((indice.current + 1) % lista.length)

  useEffect(() => {
    if (!lista.length || !abierto) return
    let cancelado = false
    document.body.classList.add('con-musica')
    cargarApi().then((YT) => {
      if (cancelado || !contenedor.current) return
      const destino = document.createElement('div')
      contenedor.current.appendChild(destino)
      player.current = new YT.Player(destino, {
        width: 200,
        height: 200,
        videoId: lista[0].youtubeId,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: (e) => e.target.playVideo(),
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) erroresSeguidos.current = 0
            if (e.data === YT.PlayerState.ENDED) siguiente() // bucle por la lista
          },
          onError: (e) => {
            if (!ERRORES_DE_INCRUSTACION.includes(e.data) && e.data !== 2 && e.data !== 5) return
            erroresSeguidos.current += 1
            if (erroresSeguidos.current >= lista.length) setFallo(true)
            else siguiente()
          },
        },
      })
    })
    return () => {
      cancelado = true
      document.body.classList.remove('con-musica')
      try { player.current?.destroy() } catch { /* ya destruido */ }
      player.current = null
      if (contenedor.current) contenedor.current.innerHTML = ''
    }
  }, [abierto])

  if (!lista.length || !abierto) return null

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
        <span className="musica-titulo">{fallo ? 'No se pudo reproducir' : lista[actual].titulo}</span>
        <button onClick={alternar} aria-label="Reproducir o pausar">⏯</button>
        <button onClick={siguiente} aria-label="Siguiente video">⏭</button>
        <button onClick={() => setAbierto(false)} aria-label="Cerrar reproductor">✕</button>
      </div>
    </aside>
  )
}
