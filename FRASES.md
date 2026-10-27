# Completá la frase y ayudas de suerte

## Diagnóstico y contenido aprobado

La tarjeta estaba en «Próximamente» porque el catálogo tenía cero entradas aprobadas. El interruptor estaba encendido. El despliegue a2e48f3 había terminado correctamente; también podía verse una portada anterior por caché del navegador o service worker.

La autorización nueva permite seleccionar hasta cuarenta fragmentos, uno por canción, de una sola línea de cinco a diez palabras. Se incorporaron **34 fragmentos de 34 canciones**, con dos o tres palabras de cuatro letras o más aptas para ocultar. Se descartaron seis candidatos iniciales por lenguaje, dobles sentidos o falta de huecos aptos. No se modificaron ni borraron los archivos privados.

Cada entrada tiene cancion, fragmento, aprobada, huecos y revisionOpciones. Cada hueco define indice (base cero), clase (sustantivo/verbo/adjetivo) y tres distractores curados. La revisión de sentido y sinónimos es editorial; la validación automática comprueba cuatro opciones normalizadas distintas, una sola coincidencia con la respuesta canónica, longitudes aproximadas, índices y clases declaradas. No se genera contenido ni se mezclan palabras arbitrarias como distractores.

## Rondas

Casual oculta dos palabras; tocá un hueco para ver sus cuatro opciones. Muestra el disco. Ricotero oculta dos o tres y usa casillas y teclado físico/en pantalla, sin contexto. Las respuestas admiten ausencia de tildes y N por Ñ. Dos fallos pueden revelar una letra mientras queden pistas; si no, se ofrece la suerte. Siempre hay un hueco dentro de la frase, no solamente al final. Después de responder se muestran canción y disco.

El motor elige hasta diez canciones distintas, prioriza las menos recientes y acorta la ronda si el banco recibido es menor. El menú se habilita desde diez canciones válidas. Las rondas normales guardan historial por perfil; los desafíos llevan semilla y plan, sin alias. Frases del día usa una semilla por fecha de Buenos Aires. Cada frase completamente correcta vale un punto. Se conservan récord, partidas, compartir y logro de diez sin pistas.

MODOS.completarFrase=false oculta el juego y excluye el JSON del grafo de producción. Los ejemplos inventados permanecen fuera del bundle y no se usan con el catálogo real.

## Ayudas durante la partida

Se eliminaron la moneda diaria, los bonus al terminar, los dados por hitos y el inventario de comodines. El esquema 10 conserva progreso, perfiles y fechas de logros; migra los contadores históricos de moneda/seises. El original v9 queda respaldado antes de guardar v10.

Cada modo tiene el botón Pista. Con cero pistas cambia a «🪙 Sin pistas: tentá la suerte» y ofrece moneda o dado. Dos fallos seguidos con cero pistas también abren la oferta. Casual permite dos tiradas; Ricotero una. La clave de la partida y los créditos de suerte se guardan por perfil, sin trasladar pistas a otra partida. La moneda da dos pistas al acertar P/R y una al fallar. El dado da una para 1–2, dos para 3–5 y tres para 6. Sorteo con crypto.getRandomValues antes de animar, sin sesgo de módulo. No hay pérdidas, compras ni dinero.

La moneda tiene dos caras, canto estriado y grosor. El dado tiene seis caras físicas con puntos, rotaciones verificadas y rebote. Reducir movimiento muestra el resultado sin giro. Los sonidos de giro y caída usan Web Audio y la preferencia existente de efectos/vibración. El proyecto de referencia solicitado no estaba disponible; las formas y estilos son propios.

## Versiones y QA

Ayuda muestra fecha de build (UTC) y hash corto. En Cloudflare se toma WORKERS_CI_COMMIT_SHA; localmente se consulta Git. La PWA avisa «Hay una versión nueva · Actualizar» y activa el SW nuevo al pulsar el botón, sin forzar una recarga durante una partida.

- node scripts/ejecutar.mjs scripts/verificar-frases.mjs: 200 rondas, huecos, opciones, historial, perfiles, logros y replay.
- node scripts/ejecutar.mjs scripts/verificar-bonus.mjs: migración v9→v10, premios, consumo y límites.
- node scripts/ejecutar.mjs scripts/verificar.mjs: regresión de los modos y enlaces anteriores.
- node scripts/qa-ricotero.mjs: 360×640, 390×844 y 1280×720, ronda real, teclado y offline.
- node scripts/qa-suerte.mjs: moneda/dado durante partidas, caras visibles, límites y movimiento reducido.
- node scripts/qa-actualizacion.mjs: dos SW reales, aviso y recarga al actualizar.
- node scripts/qa-bonus-fondo.mjs: fondo conservado; Firefox sigue pendiente por spawn UNKNOWN del entorno.
- node scripts/auditar-letras.mjs <carpeta-privada>: solo cantidades, sin imprimir letras; verifica las 34 fuentes de una sola línea y ventanas de veinte caracteres. Títulos/autores públicos se cuentan aparte como metadatos.
- node scripts/verificar-flag-frases.mjs: JSON fuera del grafo al apagar el flag.
- npm run build y npx wrangler deploy --dry-run.

Los informes están en qa/. No se modificaron Ahorcado, el reproductor musical, el motor del fondo, wrangler.jsonc, el Worker ni URL_JUEGO.
