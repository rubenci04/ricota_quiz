// Configuración del juego. Todo lo que cambia al publicar vive acá (ver PUBLICAR.md).
// Este archivo no importa nada para que también lo pueda leer vite.config.js.

// Nombre del juego: se usa en el título, el tutorial, al compartir y en los metadatos.
export const NOMBRE_JUEGO = 'ricota_quiz'

export const DESCRIPCION =
  'Juego de fans con sopa de letras, trivia, crucigrama y adivinanzas sobre la cultura ricotera. No oficial.'

// Dirección pública del juego, sin barra final (se usa al compartir y en los metadatos). VALOR DE EJEMPLO.
export const URL_JUEGO = 'https://ricota-quiz.pages.dev'

// Correo para pedir correcciones o el retiro de contenido. VALOR DE EJEMPLO.
export const EMAIL_CONTACTO = 'contacto@ejemplo.com'

// Cloudflare Web Analytics (sin cookies). Apagada por defecto; el token es un valor de ejemplo.
export const ANALITICA = { activa: false, token: 'TOKEN_DE_EJEMPLO' }
