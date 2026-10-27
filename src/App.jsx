import { useEffect, useRef, useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'
import Trivia from './Trivia.jsx'
import Adivinanzas from './Adivinanzas.jsx'
import Crucigrama from './Crucigrama.jsx'
import Tutorial from './Tutorial.jsx'
import RetoDelDia from './RetoDelDia.jsx'
import Logros from './Logros.jsx'
import Perfiles from './Perfiles.jsx'
import { maximoAlcanzado } from './niveles.js'
import CompletarFrase from './CompletarFrase.jsx'
import { frasesDisponibles } from './catalogoFrases.js'
import TriviaMenu from './TriviaMenu.jsx'
import Discografia from './Discografia.jsx'
import Ahorcado from './Ahorcado.jsx'
import Legal from './Legal.jsx'
import { MODOS_DESAFIO, leerDesafio, limpiarHash } from './desafio.js'
import { efemeridesDeHoy } from './efemerides.js'
import { DESARROLLADOR, MODOS, NOMBRE_JUEGO } from './config.js'
import { alDesbloquear, iniciarLogros } from './logros.js'
import { fechaBA, rachaCortada, rachaVigente } from './reto.js'
import Musica from './Musica.jsx'
import Fondo from './Fondo.jsx'
import { Contador } from './Animados.jsx'
import {
  alternarSonido,
  alternarVibracion,
  sonar,
  sonidoActivo,
  vibracionActiva,
  vibracionDisponible,
} from './sonido.js'
import { guardar, leer, leerPerfiles, marcarModo, suscribir } from './storage.js'

// Juegos numerados; el reto diario y el archivo se presentan por separado.
const MODOS_MENU = [
  { id: 'frases', nombre: 'Completá la frase', detalle: frasesDisponibles ? 'Una palabra cambia todo' : 'Próximamente', icono: '✏️', color: 'var(--c-dicho)', destacada: true, deshabilitada: !frasesDisponibles, activo: MODOS.completarFrase },
  { id: 'dicho', nombre: 'Dicho de otra forma', detalle: 'Adiviná la canción a partir de un acertijo', icono: '🧩', color: 'var(--c-dicho)' },
  { id: 'crucigrama', nombre: 'Crucigrama', detalle: 'Palabras y definiciones', icono: '✍️', color: 'var(--c-cruci)' },
  { id: 'sopa', nombre: 'Sopa de letras', detalle: 'Encontrá las palabras', icono: '🔍', color: 'var(--c-sopa)' },
  { id: 'trivia', nombre: 'Trivia', detalle: 'Trivia general · La banda', icono: '🧠', color: 'var(--c-trivia)' },
  { id: 'palabras', nombre: 'Adiviná por palabras', detalle: 'Palabras clave → canción', icono: '🔤', color: 'var(--c-palabras)' },
].filter(m => m.activo !== false)


export default function App() {
  const musica = useRef(null)
  const [, actualizar] = useState(0)
  const [verPerfiles, setVerPerfiles] = useState(() => !leerPerfiles().activo)
  useEffect(() => suscribir(() => actualizar((n) => n + 1)), [])
  const [entro, setEntro] = useState(false)
  const [verTutorial, setVerTutorial] = useState(() => !leer().tutorial)
  const [jugadores, setJugadores] = useState(null) // 'solo' | null (vs amigo: próximamente)
  const [modo, setModo] = useState(null)
  const [desafio, setDesafio] = useState(() => leerDesafio()) // desafío recibido por link
  const [aceptado, setAceptado] = useState(false)
  const [pagina, setPagina] = useState(null) // 'aviso' | 'privacidad' | 'contacto'
  const [efemerides] = useState(() => efemeridesDeHoy())
  const [sonido, setSonido] = useState(sonidoActivo)
  const [vibracion, setVibracion] = useState(vibracionActiva)
  const [estadoMusica, setEstadoMusica] = useState('pausado') // reproduciendo | silenciado | pausado
  const [avisos, setAvisos] = useState([]) // logros recién desbloqueados
  const volver = () => setModo(null)
  // inclinación leve de las tarjetas del menú con el puntero o el toque
  const inclinar = (e) => {
    const t = e.target.closest?.('.tarjeta-modo')
    if (!t || t.disabled || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const r = t.getBoundingClientRect()
    t.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`)
    t.style.setProperty('--rx', `${-((e.clientY - r.top) / r.height - 0.5) * 12}deg`)
  }
  const enderezar = (e) => {
    const t = e.target.closest?.('.tarjeta-modo')
    t?.style.removeProperty('--rx')
    t?.style.removeProperty('--ry')
  }
  const elegirModo = (id) => {
    marcarModo(id === 'dicho' || id === 'palabras' ? 'adivinanzas' : id)
    setModo(id)
  }

  const salirDelDesafio = () => {
    limpiarHash()
    setDesafio(null)
    setAceptado(false)
    setModo(null)
  }

  useEffect(() => {
    // un link de desafío inválido se ignora: se limpia y se va al menú
    if (location.hash.startsWith('#/desafio') && !leerDesafio()) limpiarHash()
    const alCambiarHash = () => {
      const d = leerDesafio()
      if (!d && location.hash.startsWith('#/desafio')) limpiarHash()
      setDesafio(d)
      setAceptado(false)
    }
    window.addEventListener('hashchange', alCambiarHash)
    return () => window.removeEventListener('hashchange', alCambiarHash)
  }, [])


  useEffect(() => {
    const quitarAviso = alDesbloquear((logro) => {
      setAvisos((prev) => [...prev, logro])
      setTimeout(() => setAvisos((prev) => prev.filter((l) => l.id !== logro.id)), 5000)
    })
    const detener = iniciarLogros()
    return () => {
      quitarAviso()
      detener()
    }
  }, [])
  const g = leer()

  let contenido
  if (pagina) {
    contenido = <Legal seccion={pagina} onVolver={() => setPagina(null)} onMenu={() => setPagina(null)} />
  } else if (verPerfiles) {
    contenido = <Perfiles onElegir={() => {
      setModo(null); setAvisos([]); setVerPerfiles(false); setEntro(true)
    }} onVolver={() => setVerPerfiles(false)} />
  } else if (!entro) {
    contenido = (
      <main className="pantalla inicio" key="bienvenida">
        <h1 className="logo">{NOMBRE_JUEGO}</h1>
        <p className="sub">Patricio Rey y sus Redonditos de Ricota</p>
        <button className="nueva entrar" onClick={() => setEntro(true)}>Entrar</button>
        <p className="aviso">Juego de fans, no oficial, sin relación con la banda.</p>
      </main>
    )
  } else if (verTutorial) {
    contenido = <Tutorial onTerminar={() => setVerTutorial(false)} />
  } else if (desafio && !aceptado) {
    const m = MODOS_DESAFIO[desafio.modo]
    contenido = (
      <main className="pantalla inicio" key="desafio">
        <h1 className="logo">{NOMBRE_JUEGO}</h1>
        <p className="sub">¡Te desafiaron!</p>
        <article className="tarjeta">
          <h2>Tu amigo hizo {m.formato(desafio.puntaje)}</h2>
          <p>¿Podés superarlo? Es {m.descripcion} y vas a jugar exactamente el mismo puzzle.</p>
        </article>
        <button
          className="nueva"
          onClick={() => {
            marcarModo(desafio.modo)
            setJugadores('solo')
            setAceptado(true)
          }}
        >
          Aceptar el desafío
        </button>
        <button className="secundario" onClick={salirDelDesafio}>Ir al menú</button>
      </main>
    )
  } else if (desafio) {
    const props = { onVolver: salirDelDesafio, onMenu: salirDelDesafio, desafio }
    if (desafio.modo === 'sopa') contenido = <SopaDeLetras {...props} />
    else if (desafio.modo === 'crucigrama') contenido = <Crucigrama {...props} />
    else if (desafio.modo === 'adivinanzas') contenido = <Adivinanzas {...props} />
    else if (desafio.modo === 'frases') contenido = MODOS.completarFrase
      ? <CompletarFrase {...props} />
      : <main className="pantalla"><p>Completá la frase no está disponible.</p><button onClick={salirDelDesafio}>Volver al menú</button></main>
    else contenido = <Trivia {...props} categoria={desafio.modo === 'banda' ? 'banda' : 'general'} />
  } else if (!jugadores) {
    contenido = (
      <main className="pantalla inicio" key="jugadores">
        <h1 className="logo">{NOMBRE_JUEGO}</h1>
        <p className="sub">¿Cómo querés jugar?</p>
        <nav className="menu">
          <button className="modo" onClick={() => setJugadores('solo')}>
            <span>Un jugador<small>Practicá y sumá puntos</small></span>
          </button>
          <button className="modo" disabled>
            <span>Contra un amigo<small>Sala online: elegís juegos y temática</small></span>
            <em className="pronto">Próximamente</em>
          </button>
        </nav>
      </main>
    )
  } else if (modo === 'reto') contenido = <RetoDelDia onVolver={volver} onMenu={volver} />
  else if (modo === 'logros') contenido = <Logros onVolver={volver} onMenu={volver} />
  else if (modo === 'discografia') contenido = <Discografia onVolver={volver} onMenu={volver} />
  else if (modo === 'ahorcado' && MODOS.ahorcado) contenido = <Ahorcado onVolver={volver} />
  else if (modo === 'sopa') contenido = <SopaDeLetras onVolver={volver} onMenu={volver} />
  else if (modo === 'frases' && MODOS.completarFrase) contenido = <CompletarFrase onVolver={volver} onMenu={volver} />
  else if (modo === 'trivia') contenido = <TriviaMenu onVolver={volver} onMenu={volver} />
  else if (modo === 'dicho' || modo === 'palabras') contenido = <Adivinanzas onVolver={volver} onMenu={volver} inicio={modo} />
  else if (modo === 'crucigrama') contenido = <Crucigrama onVolver={volver} onMenu={volver} />
  else if (modo === 'banda') contenido = <Trivia onVolver={volver} onMenu={volver} categoria="banda" />
  else {
    contenido = (
      <main className="pantalla inicio" key="menu">
        <h1 className="logo">{NOMBRE_JUEGO}</h1>
        <p className="sub">Patricio Rey y sus Redonditos de Ricota</p>
        <button className="reto-banner" onClick={() => elegirModo('reto')}>📅 <strong>Reto del día</strong><small>Una canción por día, igual para todos →</small></button>
        <nav className="menu-grid" aria-label="Modos de juego" onPointerMove={inclinar} onPointerDown={inclinar} onPointerLeave={enderezar} onPointerUp={enderezar} onPointerCancel={enderezar} onPointerOut={enderezar}>
          {MODOS_MENU.map((m, i) => (
            <button
              key={m.id}
              disabled={m.deshabilitada}
              className={`tarjeta-modo${m.destacada ? ' destacada' : ''}${m.chica ? ' chica' : ''}`}
              style={{ '--c': m.color, '--i': i }}
              onClick={() => elegirModo(m.id)}
            >
              {m.insignia && <span className="insignia">{m.insignia}</span>}
              <span className="icono" aria-hidden="true">{m.icono}</span>
              <strong>{i + 1}. {m.nombre}</strong>
              {m.detalle && <small>{m.detalle}</small>}
            </button>
          ))}
        </nav>
        <p className="perfil-activo">Jugando como <strong>{g.alias}</strong></p>
        <button className="secundario" onClick={() => setVerPerfiles(true)}>Cambiar o editar perfil</button>
        {efemerides.map((e) => (
          <p key={e.dia + e.frase} className="efemeride" role="note">🎂 {e.texto}</p>
        ))}
        <section className="stats">
          <div><b><Contador valor={maximoAlcanzado(g, 'trivia')} /></b>Nivel trivia</div>
          <div><b><Contador valor={`${g.mejor}/10`} /></b>Mejor trivia</div>
          <div><b><Contador valor={g.sopas} /></b>Sopas hechas</div>
          <div><b><Contador valor={g.adivinanzas} /></b>Pts adivinanzas</div>
          <div><b><Contador valor={maximoAlcanzado(g, 'banda')} /></b>Nivel banda</div>
          <div><b><Contador valor={g.crucigramas} /></b>Crucigramas</div>
          <div><b><Contador valor={rachaVigente(g, fechaBA())} /></b>Racha reto (máx. {g.rachaMax})</div>
        </section>
        {rachaCortada(g, fechaBA()) && (
          <p className="aviso-amable" role="note">
            Ayer no jugaste el reto y la racha se reinició. ¡Pasa en las mejores familias! Hoy arrancás otra. 💪
          </p>
        )}
        <section className="extras"><h2>Extras · no son juegos</h2><div className="herramientas">
          <button className="secundario" onClick={() => setModo('discografia')}>Archivo ricotero</button>
          <button className="secundario" onClick={() => setModo('logros')}>Logros ({Object.keys(g.logros).length})</button>
          <button className="secundario" onClick={() => setVerTutorial(true)}>Ayuda</button>
        </div></section>
      </main>
    )
  }

  // el modo en curso tiñe la pantalla con su color
  const modoActual = desafio && aceptado ? (desafio.modo === 'adivinanzas' ? 'dicho' : desafio.modo) : modo

  // clic sonoro en cualquier botón
  const alClic = (e) => {
    if (e.target.closest('button:not(:disabled)')) sonar('clic')
  }

  return (
    <div className="app" data-modo={modoActual || 'menu'} data-perfiles={verPerfiles && !pagina} data-fondo={g.fondo} onClick={alClic}>
      <Fondo activo={g.fondo} />
      <div className="interruptores" aria-label="Sonido y música">
        <button
          className="sonido"
          onClick={() => setSonido(alternarSonido())}
          aria-label={sonido ? 'Silenciar efectos' : 'Activar efectos'}
          aria-pressed={sonido}
        >
          {sonido ? '🔊' : '🔇'}
        </button>
        <button
          className={`sonido musica-estado ${estadoMusica}`}
          onClick={() => musica.current?.alternar()}
          aria-label={{ reproduciendo: 'Música sonando: tocá para pausar', silenciado: 'Música silenciada: tocá para activar el sonido', pausado: 'Música en pausa: tocá para reproducir' }[estadoMusica]}
          aria-pressed={estadoMusica === 'reproduciendo'}
        >
          ♪
        </button>
        <button className="sonido" onClick={() => musica.current?.siguiente()} aria-label="Siguiente canción">⏭</button>
        <button
          className="sonido"
          onClick={() => guardar({ fondo: !g.fondo })}
          aria-label={g.fondo ? 'Desactivar fondo animado' : 'Activar fondo animado'}
          title="Fondo animado"
          aria-pressed={g.fondo}
        >
          {g.fondo ? '✨' : '▫️'}
        </button>
        {vibracionDisponible() && (
          <button
            className="sonido"
            onClick={() => setVibracion(alternarVibracion())}
            aria-label={vibracion ? 'Desactivar vibración' : 'Activar vibración'}
            aria-pressed={vibracion}
          >
            {vibracion ? '📳' : '📴'}
          </button>
        )}
      </div>
      {contenido}
      {leerPerfiles().errorPersistencia && <p className="aviso-amable" role="alert">No se pudo guardar en este navegador. El avance actual solo está en memoria; evitá cerrar o recargar.</p>}
      <div className="avisos-logros" role="status" aria-live="polite">
        {avisos.map((l) => <p key={l.id} className="aviso-logro">🏆 ¡Logro desbloqueado! <strong>{l.nombre}</strong></p>)}
      </div>
      <Musica controlRef={musica} onEstado={setEstadoMusica} />
      <footer className="pie">
        <span>{NOMBRE_JUEGO} · Juego de fans, no oficial, sin relación con la banda.</span>
        <span>Developer: {DESARROLLADOR} · Derechos reservados</span>
        <nav className="pie-enlaces" aria-label="Información legal">
          <button onClick={() => setPagina('aviso')}>Aviso legal</button>
          <button onClick={() => setPagina('privacidad')}>Privacidad</button>
          <button onClick={() => setPagina('contacto')}>Contacto</button>
        </nav>
      </footer>
    </div>
  )
}
