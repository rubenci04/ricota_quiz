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
- `public/_headers` evita que el HTML, el service worker y el manifest queden en caché vieja; la PWA se actualiza sola (`autoUpdate`).
- Página 404: `wrangler.jsonc` ya configura `assets.not_found_handling = "404-page"` y `assets.directory = "./dist"`. No cambiar ese archivo, el Worker ni `URL_JUEGO` en estas entregas. Los pushes a `main` activan el despliegue automático. Los desafíos viajan en el hash y el servidor recibe `/`.
- Las efemérides (`src/data/efemerides.json`) solo incluyen fechas confirmadas con fuente.
- Fuera del build quedan `datos-pendientes/`, `.claude/` y las letras privadas (que además están fuera del proyecto).

## Fondo animado y compatibilidad

El comportamiento anterior dibujaba una sola imagen al detectar `prefers-reduced-motion`. Otras causas probables de un fondo quieto son la pestaña oculta, el ahorro de batería del navegador, el renderizado por software, un contexto canvas perdido o drivers que bloquean la aceleración. El código no puede identificar el plan de energía del sistema; menos de 15 fps se informa como «ahorro de energía o rendimiento bajo».

Ayuda y ajustes muestra el estado: «reducir movimiento del sistema», «animación desactivada por vos», «ahorro de energía o rendimiento bajo» o «activo (X fps)». Al encender manualmente Fondo animado se guarda `fondoForzado` en las preferencias del dispositivo: permite animarlo aunque el sistema solicite reducir movimiento. El cambio de preferencia del sistema también se escucha durante la sesión.

Se mide el ritmo de cuadros cada 1,5 segundos. Por debajo de 30 fps se reducen partículas; las luces siguen. Una pestaña oculta pausa el canvas. Si falla el contexto o la comprobación de aceleración (`webgl` con `failIfMajorPerformanceCaveat`), se usan tres haces CSS. El respaldo CSS también respeta el interruptor y la activación explícita; los giros de bonus siempre respetan reducir movimiento.

QA: `node scripts/qa-bonus-fondo.mjs` ejercita el canvas con disponibilidad de aceleración simulada y el fallo de canvas con respaldo CSS. En Chromium se verificó movimiento real y unos 60 fps. Firefox 157 se descargó para la prueba, pero Windows rechazó iniciar el ejecutable con `spawn UNKNOWN`; queda pendiente verificarlo en una máquina que lo ejecute. Esto no demuestra compatibilidad real con Firefox.

## Bonus locales (esquema 9)

Moneda diaria por perfil y día de Buenos Aires; otra moneda con probabilidad de 1/4 por buen resultado. Cada partida queda registrada para impedir repetir su bonus. El dado se ofrece una vez por primera partida de cada juego, por rachas 3/7/30 y al resolver todas las canciones cargadas de un disco mediante Adiviná, Dicho, Reto, Sopa o Crucigrama. «Disco completado» se refiere al catálogo de canciones del juego, que puede ser parcial respecto del disco real.

Inventario máximo cinco de cada tipo, sin compras ni dinero. Las recompensas pendientes sobreviven al cambio de perfil y a la recarga. ⭐ suma una copia del puntaje de la siguiente partida terminada al contador de bonus del perfil; no cambia máximos, niveles, semillas ni resultados base de los desafíos. Las otras ayudas aparecen según su utilidad: pistas en todos los juegos, 50/50 en Trivia y frases Casual, segunda oportunidad en Trivia, frases y el reto en curso. No se modifica Ahorcado. El registro de partidas con bonus crece con las partidas para impedir reclamar dos veces incluso tras muchas sesiones.

La migración conserva v5/v6/v7/v8 y respalda el almacenamiento v8 antes de guardar v9. Comprobación: `node scripts/ejecutar.mjs scripts/verificar-bonus.mjs`.

Dicho y Adiviná colocan aproximadamente 40% de letras en Casual (mínimo dos y cada inicial) y 15% en Ricotero (mínimo una, de la palabra más larga), mediante semilla. Casual tiene base dos puntos y Ricotero tres, con descuento por pistas pedidas y mínimo uno. Los desafíos antiguos mantienen base tres; los nuevos identifican la regla en el plan del enlace (`reglasAdivinanza: 2`). Las letras iniciales no consumen pistas ni descuentan puntos.

Auditoría sin imprimir letras: `node scripts/auditar-letras.mjs <carpeta-privada>`. Compara ventanas de 20 caracteres de las cadenas del bundle con los archivos privados, también cruzando saltos de línea. Excluye explícitamente los fragmentos aprobados y los títulos/autores públicos, que son metadatos y se cuentan aparte. Exige cero coincidencias restantes y comprueba rutas privadas, ejemplos DEV e interpretaciones no verificadas. El informe contiene solo cantidades (`qa/auditoria-letras.json`).
