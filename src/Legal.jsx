import { ANALITICA, EMAIL_CONTACTO, NOMBRE_JUEGO } from './config.js'
import musica from './data/musica.json'

const TITULOS = { aviso: 'Aviso legal', privacidad: 'Privacidad', contacto: 'Contacto' }

function Contacto() {
  return (
    <>
      <p>
        Para pedir una corrección, avisar un error o solicitar el retiro de algún contenido, escribinos a{' '}
        <a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a>.
      </p>
      <p>Para que podamos responder rápido, contanos qué contenido es (modo, pregunta o texto) y qué querés que cambiemos o retiremos.</p>
    </>
  )
}

function Aviso() {
  return (
    <>
      <p>
        <strong>{NOMBRE_JUEGO}</strong> es un juego de fans, no oficial. No tiene relación con la banda Patricio Rey y sus
        Redonditos de Ricota, con sus integrantes, ni con sus representantes, sellos o herederos, y no cuenta con su
        autorización ni respaldo.
      </p>
      <p>
        Los nombres, marcas, títulos y obras mencionados pertenecen a sus respectivos titulares y se nombran solo para
        identificar los temas del juego. El juego no reproduce letras ni canciones: usa palabras sueltas, definiciones y
        textos propios. La música, si se incluye, se reproduce desde sus fuentes originales.
      </p>
      <p>
        Los datos (discos, años, integrantes, curiosidades) se contrastaron con fuentes públicas, pero pueden tener
        errores. Si encontrás uno, avisanos. Si sos titular de derechos y querés que se corrija o retire algún
        contenido, escribinos a <a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a>: lo revisamos y lo resolvemos
        lo antes posible.
      </p>
    </>
  )
}

function Privacidad() {
  return (
    <>
      <p><strong>No pedimos datos personales.</strong> No hay cuentas, registros ni formularios.</p>
      <p>
        Tu progreso (niveles, puntajes, logros, racha y preferencias como el sonido) se guarda únicamente en tu
        dispositivo, en el almacenamiento local del navegador. No se envía a ningún servidor y podés borrarlo cuando
        quieras desde los datos del sitio de tu navegador.
      </p>
      <p>
        Los links de desafío incluyen solo el modo, el tema, la dificultad, una semilla y un puntaje. No llevan nombres
        ni datos personales.
      </p>
      <p>
        Analítica: {ANALITICA.activa
          ? 'usamos Cloudflare Web Analytics, que mide visitas de forma agregada, sin cookies y sin identificar a las personas.'
          : 'hoy está desactivada. Si se activa, será Cloudflare Web Analytics, que mide visitas de forma agregada, sin cookies y sin identificar a las personas.'}
      </p>
      <p>
        {musica.length > 0
          ? 'Si abrís el reproductor de música, el video se carga desde YouTube y se aplican las políticas de YouTube y Google.'
          : 'Hoy el juego no carga contenido de terceros. Si se agrega música de YouTube, el reproductor cargará el video desde YouTube y se aclarará acá.'}
      </p>
      <p>
        Como cualquier sitio, el servicio de alojamiento puede registrar datos técnicos de conexión (por ejemplo, la
        dirección IP) para funcionar y protegerse de abusos. Para consultas sobre privacidad: <a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a>.
      </p>
    </>
  )
}

export default function Legal({ seccion, onVolver }) {
  const Contenido = { aviso: Aviso, privacidad: Privacidad, contacto: Contacto }[seccion] || Aviso
  return (
    <main className="pantalla" key={`legal-${seccion}`}>
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver">←</button>
        <h2>{TITULOS[seccion] || TITULOS.aviso}</h2>
      </header>
      <article className="legal">
        <Contenido />
      </article>
    </main>
  )
}
