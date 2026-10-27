# Valores de publicación

Todo se cambia en **`src/config.js`**, salvo lo que se indica. Estado actual:

| Qué | Dónde | Valor hoy |
|---|---|---|
| Nombre del juego | `NOMBRE_JUEGO` | `Ricotero Quiz` |
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
- Los desafíos nuevos incluyen un plan de selección v3 con identificadores de contenido, sin alias. Los enlaces anteriores siguen aceptándose; sus pistas también respetan el catálogo curado. El historial guarda 150 identificadores por modo y perfil y las tres últimas partidas; las categorías de Dicho conservan además el ciclo del catálogo.

- El nombre, la descripción y la URL salen de `src/config.js` hacia `index.html` (título, Open Graph, Twitter) y el manifest de la PWA.
- `public/og.png` tiene el nombre dibujado: si cambiás el nombre, hay que rehacerla. Los íconos no llevan texto.
- Música: el reproductor usa la lista de YouTube de `PLAYLIST_YOUTUBE` (si queda vacía, usa `src/data/musica.json`), arranca desde un video al azar y sigue en orden aleatorio y en bucle. Salta al siguiente video si uno no se puede incrustar. Cambiar `PLAYLIST_YOUTUBE` ajusta solo la página de Privacidad.
- `public/_headers` configura la revalidación del HTML, service worker y manifest. La PWA avisa cuando hay una versión nueva y la activa al pulsar Actualizar.
- Página 404: `wrangler.jsonc` ya configura `assets.not_found_handling = "404-page"` y `assets.directory = "./dist"`. No cambiar ese archivo, el Worker ni `URL_JUEGO` en estas entregas. Los pushes a `main` activan el despliegue automático. Los desafíos viajan en el hash y el servidor recibe `/`.
- Las efemérides (`src/data/efemerides.json`) solo incluyen fechas confirmadas con fuente.
- Fuera del build quedan `datos-pendientes/`, `.claude/` y las letras privadas (que además están fuera del proyecto).

## Fondo animado y compatibilidad

El comportamiento anterior dibujaba una sola imagen al detectar `prefers-reduced-motion`. Otras causas probables de un fondo quieto son la pestaña oculta, el ahorro de batería del navegador, el renderizado por software, un contexto canvas perdido o drivers que bloquean la aceleración. El código no puede identificar el plan de energía del sistema; menos de 15 fps se informa como «ahorro de energía o rendimiento bajo».

Ayuda y ajustes muestra el estado: «reducir movimiento del sistema», «animación desactivada por vos», «ahorro de energía o rendimiento bajo» o «activo (X fps)». Al encender manualmente Fondo animado se guarda `fondoForzado` en las preferencias del dispositivo: permite animarlo aunque el sistema solicite reducir movimiento. El cambio de preferencia del sistema también se escucha durante la sesión.

Se mide el ritmo de cuadros cada 1,5 segundos. Por debajo de 30 fps se reducen partículas; las luces siguen. Una pestaña oculta pausa el canvas. Si falla el contexto o la comprobación de aceleración (`webgl` con `failIfMajorPerformanceCaveat`), se usan tres haces CSS. El respaldo CSS también respeta el interruptor y la activación explícita; los giros de bonus siempre respetan reducir movimiento.

QA: `node scripts/qa-bonus-fondo.mjs` ejercita el canvas con disponibilidad de aceleración simulada y el fallo de canvas con respaldo CSS. En Chromium se verificó movimiento real y unos 60 fps. Firefox 157 se descargó para la prueba, pero Windows rechazó iniciar el ejecutable con `spawn UNKNOWN`; queda pendiente verificarlo en una máquina que lo ejecute. Esto no demuestra compatibilidad real con Firefox.

## Frases, ayudas y versión actual

El catálogo aprobado contiene 34 fragmentos de 34 canciones. La causa de «Próximamente» era el banco vacío, no el interruptor. El despliegue anterior se verificó como exitoso en GitHub/Cloudflare. El detalle de formato, autorización, selección y QA está en [FRASES.md](FRASES.md).

El esquema 10 retira el inventario y los bonus diarios/de fin/hitos. Conserva los logros anteriores y migra estadísticas. La suerte ofrece pistas dentro de la partida, con dos tiradas en Casual y una en Ricotero, y créditos separados por perfil y clave de partida.

Ayuda muestra fecha UTC y hash generados en el build. Workers Builds inyecta [WORKERS_CI_COMMIT_SHA](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#default-variables); Git se usa como respaldo local. No se guarda el sello en un archivo versionado, para evitar un hash que se invalide a sí mismo.

La PWA usa actualización con aviso. Se registra /sw.js sin caché HTTP para la comprobación, escucha un SW nuevo y muestra «Hay una versión nueva · Actualizar». El botón manda SKIP_WAITING y recarga al cambiar el controlador. Una PWA vieja puede mostrar una pantalla anterior hasta recibir la nueva; el sello de Ayuda permite distinguirlas. El aviso se probó con dos SW reales consecutivos.

Auditoría: node scripts/auditar-letras.mjs <carpeta-privada>. Exige cero ventanas de veinte caracteres fuera de fragmentos aprobados y metadatos públicos (títulos/autores), comprueba cada fuente como una sola línea y excluye rutas privadas, ejemplos DEV e interpretaciones sin verificar. No imprime contenido privado.
