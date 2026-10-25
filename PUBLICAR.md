# Antes de publicar

Todo se cambia en **`src/config.js`**, salvo lo que se indica. Nada de esto está publicado todavía.

| Qué | Dónde | Valor hoy (de ejemplo) |
|---|---|---|
| Nombre del juego | `NOMBRE_JUEGO` en `src/config.js` | `ricota_quiz` |
| URL pública (sin barra final) | `URL_JUEGO` en `src/config.js` | `https://ricota-quiz.pages.dev` |
| Email de contacto y retiro de contenido | `EMAIL_CONTACTO` en `src/config.js` | `contacto@ejemplo.com` |
| Analítica (Cloudflare Web Analytics) | `ANALITICA` en `src/config.js` | apagada, token `TOKEN_DE_EJEMPLO` |
| Música de YouTube | `src/data/musica.json` | vacío (sin reproductor) |

## Notas

- El nombre, la descripción y la URL también salen de `src/config.js` hacia `index.html` (título, Open Graph, Twitter) y el manifest de la PWA.
- La imagen `public/og.png` tiene el nombre dibujado: si cambiás el nombre, hay que rehacerla. Los íconos no llevan texto.
- Analítica: para activarla poné `activa: true` y el token real de Cloudflare Web Analytics. La página de Privacidad ya lo refleja sola.
- Si agregás videos a `musica.json`, la página de Privacidad avisa sola que se carga contenido de YouTube.
- Cloudflare Pages: comando `npm run build`, carpeta de salida `dist`. Solo se publica lo que está en `dist/`.
- `public/_headers` evita que el HTML, el service worker y el manifest queden en caché vieja; la PWA se actualiza sola (`autoUpdate`).
- Las efemérides (`src/data/efemerides.json`) solo incluyen fechas confirmadas con fuente.
- Fuera del build quedan `datos-pendientes/`, `.claude/` y las letras privadas (que además están fuera del proyecto).
