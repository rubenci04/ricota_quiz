# Completá la frase y ayudas de suerte

## Ampliación: listados icónicos y celular (27/10/2026)

Base auditada: main `766c29d`, coincidente con origin/main; compilación de referencia correcta.
Los dos listados aportados por el usuario contienen 141 entradas: 10 duplicadas, 5 con un fragmento ya usado, 68 nuevas de títulos catalogados y 58 referencias a títulos ajenos al catálogo actual (también hay material solista). La coincidencia compara palabras sin tildes ni puntuación; no certifica autoría ni transcripción. El detalle por listado/número, sin letras completas, queda en `qa/listados-frases.json`.

`frases-iconicas.json` conserva 131 aportes únicos, con referencia al listado y número. Archivo → Frases permite buscar y consultar todos; las atribuciones fuera de la discografía actual se señalan como pendientes. No se añadieron esas atribuciones a las preguntas verificadas de Trivia ni a la discografía. Dos fragmentos jugables se acortaron y conservan también el texto originalmente aportado para la colección.

41 aportes tienen huecos y alternativas revisados. El banco nuevo los combina con los 34 fragmentos anteriores: 75 variantes de 49 canciones, con diez canciones distintas por ronda e historial del perfil. Estos aportes explícitos admiten frases de 3 a 14 palabras, incluidas las icónicas cortas; la autorización anterior de 5–10 palabras sigue aplicada al banco privado original, que no se modifica. Se mantienen dos huecos en Casual y dos o tres en Ricotero, opciones curadas y normalización de tildes/Ñ.

Los nuevos desafíos usan el segmento `todos.todos.v2`. Los enlaces anteriores conservan `todos.todos`, su banco de 34 fragmentos y su algoritmo; no se reutiliza una semilla antigua sobre el banco ampliado. El campo versionFrases es independiente de la versión del plan de historial. Las ayudas nuevas llevan también v2 en su clave para separarlas de partidas anteriores. No requiere migración del progreso v10. `verificar-legado-frases.mjs` compara 200 rondas, huecos y opciones con el código y JSON originales de 766c29d.

Se agregaron Otra ronda de 10 frases, contador y progreso visibles, foco/scroll al avanzar, cuatro pistas por ronda Casual y tres Ricotero. Los huecos muestran número de palabra y longitud; las casillas son cuadradas de 40 px y las opciones tienen altura mínima de 48 px. Las palabras largas se reparten en líneas dentro de su grupo en vez de reducir las letras hasta 17 px. Se agregaron animaciones breves y mensajes originales de aliento, sin reutilizar letras como mensajes.

La ruleta es una tercera opción de suerte para todos los modos que ya utilizan AyudaPartida. Sus seis sectores equiprobables dan 1,2,1,3,1,2 pistas; comparte límites, persistencia y consumo con moneda/dado. No otorga puntos ni dinero. El sector se decide antes del giro con crypto.getRandomValues, sin afectar las semillas del contenido. Respeta reducir movimiento, sonido y vibración.

QA nueva: 24 pruebas Vitest; 400 rondas reproducibles de ambos bancos; replay v1/v2; seis sectores y límites de suerte; producción a 360,375,390 y1280 px, ronda completa y segunda ronda, colección/buscador, teclado y offline. `qa-ruleta.mjs` comprueba los seis sectores bajo la flecha, premios y movimiento reducido. Los informes no contienen rutas privadas ni letras completas.

Pendiente editorial: revisar las atribuciones no catalogadas y preparar huecos para los otros 90 aportes. Para usar estas frases como base de sopa, crucigrama y adivinanzas, conviene curar palabras/definiciones y acertijos y versionar sus bancos antes de reemplazarlos; así se mantienen sus enlaces antiguos. Los motores actuales de esos modos conservan su contenido y reglas.

Archivos de esta entrega: contenido en `src/data/frases-iconicas.json`, `src/catalogoFrases.js` y `src/frases.js`; interfaz en `src/CompletarFrase.jsx`, `src/Discografia.jsx` y `src/sistema.css`; suerte en `src/AyudaPartida.jsx` y `src/suerte.js`; enlaces y empaquetado en `src/desafio.js` y `vite.config.js`. Auditorías y QA en `scripts/auditar-listados.mjs`, `scripts/incorporar-iconicas.mjs`, `scripts/auditar-letras.mjs`, `scripts/verificar-frases.mjs`, `scripts/verificar-legado-frases.mjs`, `scripts/verificar-bonus.mjs`, `scripts/verificar-flag-frases.mjs`, `scripts/qa-ricotero.mjs` y `scripts/qa-ruleta.mjs`; sus informes quedan en `qa/`.

## Estado anterior: diagnóstico y contenido aprobado en 766c29d

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
