# Completá la frase

El catálogo `src/data/frases.json` permanece vacío hasta recibir aprobación explícita de contenido. La tarjeta muestra «Próximamente». Ningún texto privado se importa desde la aplicación.

Cada entrada usa `cancion`, `fragmento` (4–8 palabras), `faltantes` (uno o dos índices de palabra, base cero) y `aprobada: true`. También se admiten palabras inequívocas en `faltantes`. El álbum se busca por título en el catálogo existente. Revisar manualmente que las cuatro opciones de Casual tengan una sola respuesta posible por sentido, además de la validación automática.

Una ronda real necesita diez fragmentos de diez canciones diferentes y tres distractores de longitud similar por pregunta Casual. Con un banco insuficiente no se reciclan canciones. El historial prioriza material menos reciente; semilla y plan de historial viajan en los desafíos. Frases del día usa una semilla separada derivada de la fecha de Buenos Aires.

Los seis ejemplos inventados tienen `ejemplo: true`, solo sirven en desarrollo y permiten una demo de seis preguntas sin guardar progreso. El cargador de Vite los elimina en producción. Con `MODOS.completarFrase: false`, Vite sustituye el catálogo por uno vacío y no incorpora `frases.json` al grafo de módulos.

La versión 8 del almacenamiento conserva perfiles, preferencias, niveles y récords de Trivia/La banda y todos los historiales anteriores. Agrega partidas, récord y logro de frases por perfil. La banda sigue usando sus claves originales y sus enlaces antiguos.

Comprobaciones rápidas: `node scripts/ejecutar.mjs scripts/verificar-frases.mjs`, `node scripts/ejecutar.mjs scripts/verificar.mjs`, `node scripts/qa-ricotero.mjs`, `npm run build`, `npx wrangler deploy --dry-run`.

También: `node scripts/qa-ricotero.mjs --dev` para la demo y `node scripts/verificar-flag-frases.mjs` para el flag apagado. QA pasó en 360, 375 y 1280 px, con recarga offline de Trivia y sin errores de página ni desbordes. Se verificaron 200 rondas del motor, migraciones v6/v7 a v8, aislamiento de perfiles y desafíos antiguos. Los resultados están en `qa/ricotero-produccion.json` y `qa/ricotero-dev.json`.

Archivos de la entrega:

- Marca y menú: `src/config.js`, `src/App.jsx`, `src/Tutorial.jsx`, `src/Legal.jsx`, `src/styles.css`, `public/og.png`.
- Juegos y archivo: `src/TriviaMenu.jsx`, `src/Trivia.jsx`, `src/Dificultad.jsx`, `src/Discografia.jsx`, `src/Adivinanzas.jsx`, `src/adivinanza.js`, `src/SopaDeLetras.jsx`, `src/Crucigrama.jsx`.
- Motor y progreso: `src/CompletarFrase.jsx`, `src/frases.js`, `src/catalogoFrases.js`, `src/data/frases.json`, `src/data/frases.ejemplos.json`, `src/storage.js`, `src/logros.js`, `src/desafio.js`, `vite.config.js`.
- Verificación: `scripts/verificar.mjs`, `scripts/verificar-frases.mjs`, `scripts/verificar-flag-frases.mjs`, `scripts/qa-ricotero.mjs`, los dos informes QA y este documento.

Pendiente: aprobar y revisar manualmente un banco de al menos diez canciones distintas antes de habilitar el juego real. La demo limitada no mide la dificultad de futuros textos aprobados.

Actualización de esta entrega: se eligió la autorización A (solo líneas que empiecen por OK). El archivo privado tenía cero líneas así marcadas: cero entradas cargadas, cero canciones habilitadas y ninguna candidata privada modificada. No hubo frases autorizadas que revisar o descartar por ambigüedad de distractores. El catálogo permanece vacío y el juego en «Próximamente».

El esquema actual es 9 y conserva los datos de frases de v8; agrega bonus por perfil. La auditoría adicional está en `scripts/auditar-letras.mjs` y recibe la ubicación privada por argumento, sin imprimir letras. Ver detalles y limitaciones en `PUBLICAR.md`.
