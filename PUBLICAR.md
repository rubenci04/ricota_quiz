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

- El juego usa solamente tema oscuro; las preferencias antiguas de apariencia se eliminan al migrar a v7 sin perder perfiles ni progreso.
- Hasta 700 px la música está en el flujo, después del contenido. En escritorio se reserva una columna lateral. La barra superior permite pausar/reanudar y avanzar; cerrar detiene y destruye el reproductor.
- QA rápida: `npm run build`, `node scripts/ejecutar.mjs scripts/verificar.mjs`, `node scripts/ejecutar.mjs scripts/simular.mjs --despues` y `node scripts/qa-ui.mjs` (requiere Chromium de Playwright instalado).
- Los desafíos nuevos incluyen un plan de selección v3 con identificadores de contenido, sin alias. Los anteriores conservan su generación. El historial guarda 150 identificadores por modo y perfil y las tres últimas partidas; las categorías de Dicho conservan además el ciclo del catálogo.

- El nombre, la descripción y la URL salen de `src/config.js` hacia `index.html` (título, Open Graph, Twitter) y el manifest de la PWA.
- `public/og.png` tiene el nombre dibujado: si cambiás el nombre, hay que rehacerla. Los íconos no llevan texto.
- Música: el reproductor usa la lista de YouTube de `PLAYLIST_YOUTUBE` (si queda vacía, usa `src/data/musica.json`), arranca desde un video al azar y sigue en orden aleatorio y en bucle. Salta al siguiente video si uno no se puede incrustar. Cambiar `PLAYLIST_YOUTUBE` ajusta solo la página de Privacidad.
- `public/_headers` evita que el HTML, el service worker y el manifest queden en caché vieja; la PWA se actualiza sola (`autoUpdate`).
- Página 404: el repositorio no tiene archivo de configuración de Cloudflare (no hay `wrangler.jsonc`). Para que se use `404.html` en rutas inexistentes hay que activar `assets.not_found_handling = "404-page"` en la configuración del proyecto en Cloudflare, o agregar un `wrangler.jsonc` con ese valor y `assets.directory = "./dist"` (el `name` debe coincidir con el del Worker). Las rutas con `#` de desafío no se ven afectadas: el servidor solo recibe `/`.
- Las efemérides (`src/data/efemerides.json`) solo incluyen fechas confirmadas con fuente.
- Fuera del build quedan `datos-pendientes/`, `.claude/` y las letras privadas (que además están fuera del proyecto).
