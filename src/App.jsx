import { useEffect, useState } from 'react'
import SopaDeLetras from './SopaDeLetras.jsx'
import Trivia from './Trivia.jsx'
import Adivinanzas from './Adivinanzas.jsx'
import Crucigrama from './Crucigrama.jsx'
import Tutorial from './Tutorial.jsx'
import RetoDelDia from './RetoDelDia.jsx'
import Logros from './Logros.jsx'
import Perfiles from './Perfiles.jsx'
import { maximoAlcanzado } from './niveles.js'
import Discografia from './Discografia.jsx'
import Ahorcado from './Ahorcado.jsx'
import Legal from './Legal.jsx'
import { MODOS_DESAFIO, leerDesafio, limpiarHash } from './desafio.js'
import { efemeridesDeHoy } from './efemerides.js'
import { DESARROLLADOR, MODOS, NOMBRE_JUEGO } from './config.js'
import { alDesbloquear, iniciarLogros } from './logros.js'
import { fechaBA, rachaCortada, rachaVigente } from './reto.js'
import Musica from './Musica.jsx'
import { ORDEN, seguirSistema, siguienteApariencia } from './apariencia.js'
import {
  alternarSonido,
  alternarVibracion,
  sonar,
  sonidoActivo,
  vibracionActiva,
  vibracionDisponible,
} from './sonido.js'
import { leer, leerPerfiles, marcarModo, suscribir } from './storage.js'

// Menú: una tarjeta por modo, cada una con su ícono y su color. "Dicho de otra forma" es la destacada.
const LISTA_MODOS = [
  { id: 'dicho', nombre: 'Dicho de otra forma', detalle: 'Te lo cuento con otras palabras… ¿adivinás cuál es?', icono: '🧩', color: 'var(--c-dicho)', destacada: true, insignia: 'Estrella' },
  { id: 'reto', nombre: 'Reto del día', detalle: 'Una canción por día, igual para todos', icono: '📅', color: 'var(--c-reto)' },
  { id: 'banda', nombre: 'La banda', detalle: 'Trivia de nicho', icono: '🎸', color: 'var(--c-banda)' },
  { id: 'sopa', nombre: 'Sopa de letras', detalle: 'Encontrá las palabras', icono: '🔍', color: 'var(--c-sopa)' },
  { id: 'trivia', nombre: 'Trivia', detalle: '10 preguntas por nivel', icono: '🧠', color: 'var(--c-trivia)' },
  { id: 'crucigrama', nombre: 'Crucigrama', detalle: 'Con definiciones', icono: '✍️', color: 'var(--c-cruci)' },
  { id: 'discografia', nombre: 'Discografía', detalle: 'Discos, canciones y curiosidades', icono: '💿', color: 'var(--c-disco)' },
  { id: 'palabras', nombre: 'Adivinanzas por palabras', detalle: 'Palabras clave → canción', icono: '🔤', color: 'var(--c-palabras)', chica: true },
  { id: 'ahorcado', nombre: 'Ahorcado', detalle: 'Mantené las luces encendidas', icono: '💡', color: 'var(--c-ahorcado)', chica: true, activo: MODOS.ahorcado === true },
].map((m) => ({ activo: true, ...m }))

const ICONOS_APARIENCIA = { auto: '🌓', claro: '☀️', oscuro: '🌙' }
const NOMBRES_APARIENCIA = { auto: 'automático', claro: 'claro', oscuro: 'oscuro' }

// los modos opcionales apagados en config.js no aparecen en el menú
const MODOS_MENU = LISTA_MODOS.filter((m) => m.activo)

export default function App() {
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
  const [avisos, setAvisos] = useState([]) // logros recién desbloqueados
  const [apariencia, setApariencia] = useState(() => leer().apariencia)
  const volver = () => setModo(null)
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

  useEffect(() => seguirSistema(), [])

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
  else if (modo === 'trivia') contenido = <Trivia onVolver={volver} onMenu={volver} />
  else if (modo === 'dicho' || modo === 'palabras') contenido = <Adivinanzas onVolver={volver} onMenu={volver} inicio={modo} />
  else if (modo === 'crucigrama') contenido = <Crucigrama onVolver={volver} onMenu={volver} />
  else if (modo === 'banda') contenido = <Trivia onVolver={volver} onMenu={volver} categoria="banda" />
  else {
    contenido = (
      <main className="pantalla inicio" key="menu">
        <h1 className="logo">{NOMBRE_JUEGO}</h1>
        <p className="sub">Patricio Rey y sus Redonditos de Ricota</p>
        <nav className="menu-grid" aria-label="Modos de juego">
          {MODOS_MENU.map((m, i) => (
            <button
              key={m.id}
              className={`tarjeta-modo${m.destacada ? ' destacada' : ''}${m.chica ? ' chica' : ''}`}
              style={{ '--c': m.color, '--i': i }}
              onClick={() => elegirModo(m.id)}
            >
              {m.insignia && <span className="insignia">{m.insignia}</span>}
              <span className="icono" aria-hidden="true">{m.icono}</span>
              <strong>{m.nombre}</strong>
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
          <div><b>{maximoAlcanzado(g, 'trivia')}</b>Nivel trivia</div>
          <div><b>{g.mejor}/10</b>Mejor trivia</div>
          <div><b>{g.sopas}</b>Sopas hechas</div>
          <div><b>{g.adivinanzas}</b>Pts adivinanzas</div>
          <div><b>{maximoAlcanzado(g, 'banda')}</b>Nivel banda</div>
          <div><b>{g.crucigramas}</b>Crucigramas</div>
          <div><b>{rachaVigente(g, fechaBA())}</b>Racha reto (máx. {g.rachaMax})</div>
        </section>
        {rachaCortada(g, fechaBA()) && (
          <p className="aviso-amable" role="note">
            Ayer no jugaste el reto y la racha se reinició. ¡Pasa en las mejores familias! Hoy arrancás otra. 💪
          </p>
        )}
        <div className="herramientas">
          <button className="secundario" onClick={() => setModo('logros')}>Logros ({Object.keys(g.logros).length})</button>
          <button className="secundario" onClick={() => setVerTutorial(true)}>Ayuda</button>
        </div>
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
    <div className="app" data-modo={modoActual || 'menu'} data-perfiles={verPerfiles && !pagina} onClick={alClic}>
      {contenido}
      {leerPerfiles().errorPersistencia && <p className="aviso-amable" role="alert">No se pudo guardar en este navegador. El avance actual solo está en memoria; evitá cerrar o recargar.</p>}
      <div className="avisos-logros" role="status" aria-live="polite">
        {avisos.map((l) => (
          <p key={l.id} className="aviso-logro">🏆 ¡Logro desbloqueado! <strong>{l.nombre}</strong></p>
        ))}
      </div>
      <div className="interruptores">
        <button
          className="sonido"
          onClick={() => setSonido(alternarSonido())}
          aria-label={sonido ? 'Silenciar efectos' : 'Activar efectos'}
          aria-pressed={sonido}
        >
          {sonido ? '🔊' : '🔇'}
        </button>
        <button
          className="sonido"
          data-tema-btn
          onClick={() => setApariencia(siguienteApariencia())}
          aria-label={`Tema ${NOMBRES_APARIENCIA[apariencia]}. Tocar para cambiar a ${NOMBRES_APARIENCIA[ORDEN[(ORDEN.indexOf(apariencia) + 1) % ORDEN.length]]}.`}
          title={`Tema: ${NOMBRES_APARIENCIA[apariencia]}`}
        >
          {ICONOS_APARIENCIA[apariencia]}
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
      <Musica />
      <footer className="pie">
        <span>Juego de fans, no oficial, sin relación con la banda.</span>
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
