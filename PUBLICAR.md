# Valores de publicación

Todo se cambia en **`src/config.js`**, salvo lo que se indica. Estado actual:

| Qué | Dónde | Valor hoy |
|---|---|---|
| Nombre del juego | `NOMBRE_JUEGO` | `ricota_quiz` (real, sin cambios) |
| URL pública (sin barra final) | `URL_JUEGO` | `https://ricota-quiz.rea-04.workers.dev` (real) |
| Email de contacto y retiro de contenido | `EMAIL_CONTACTO` | `rea_04@hotmail.com.ar` (real) |
| Desarrollador (pie de página) | `DESARROLLADOR` | Rubén E. Albarracín |
| Analítica (Cloudflare Web Analytics) | `ANALITICA` | **apagada**: falta el token real |
| Música de YouTube | `PLAYLIST_YOUTUBE` | lista `PL5Ls9dYg2bl6fvyONvVSfkm_0r9mh0oyk` |

## Pendiente

- **Analítica:** si querés medir visitas, poné `activa: true` y el token real de Cloudflare Web Analytics. La página de Privacidad ya lo refleja sola.

## Notas

- El nombre, la descripción y la URL salen de `src/config.js` hacia `index.html` (título, Open Graph, Twitter) y el manifest de la PWA.
- `public/og.png` tiene el nombre dibujado: si cambiás el nombre, hay que rehacerla. Los íconos no llevan texto.
- Música: el reproductor usa la lista de YouTube de `PLAYLIST_YOUTUBE` (si queda vacía, usa `src/data/musica.json`). Salta al siguiente video si uno no se puede incrustar. Cambiar `PLAYLIST_YOUTUBE` ajusta solo la página de Privacidad.
- `public/_headers` evita que el HTML, el service worker y el manifest queden en caché vieja; la PWA se actualiza sola (`autoUpdate`).
- Para que Cloudflare use `404.html` en rutas inexistentes (Workers con assets), la configuración del proyecto debe tener `not_found_handling: "404-page"`.
- Las efemérides (`src/data/efemerides.json`) solo incluyen fechas confirmadas con fuente.
- Fuera del build quedan `datos-pendientes/`, `.claude/` y las letras privadas (que además están fuera del proyecto).
