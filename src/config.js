// Configuración del juego. Todo lo que cambia al publicar vive acá (ver PUBLICAR.md).
// Este archivo no importa nada para que también lo pueda leer vite.config.js.

// Nombre del juego: se usa en el título, el tutorial, al compartir y en los metadatos.
export const NOMBRE_JUEGO = 'Ricotero Quiz'

export const DESCRIPCION =
  'Juego de fans con sopa de letras, trivia, crucigrama y adivinanzas sobre la cultura ricotera. No oficial.'

// Dirección pública del juego, sin barra final (se usa al compartir y en los metadatos).
// Hoy apunta a la versión desplegada en Cloudflare Workers; cambiala si usás un dominio propio.
export const URL_JUEGO = 'https://ricota-quiz.rea-04.workers.dev'

// Correo para pedir correcciones o el retiro de contenido.
export const EMAIL_CONTACTO = 'rea_04@hotmail.com.ar'

// Quién desarrolla el juego (se muestra en el pie).
export const DESARROLLADOR = 'Rubén E. Albarracín'

// Cloudflare Web Analytics (sin cookies). Apagada: todavía no hay token real. Para activarla,
// poné activa: true y el token que da Cloudflare (Analytics → Web Analytics).
export const ANALITICA = { activa: false, token: '' }

// Lista de YouTube con la música del juego (el reproductor arranca al tocar «Entrar»).
// Dejala vacía ('') para usar los videos de src/data/musica.json, o sin música si también está vacío.
export const PLAYLIST_YOUTUBE = 'PL5Ls9dYg2bl6fvyONvVSfkm_0r9mh0oyk'

// Modos opcionales. El Ahorcado está apagado por defecto: poné true para mostrarlo en el menú.
export const MODOS = { ahorcado: false, completarFrase: true }
