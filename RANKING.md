# Ranking online (gratis)

**Estado: activo.** Base D1 `ricotero-ranking` y Worker en `https://ricotero-ranking.rea-04.workers.dev` (creados en la cuenta de Cloudflare del proyecto); `RANKING_URL` ya apunta ahí. Las instrucciones de abajo sirven para recrearlo o moverlo.

El juego ya trae todo el código. Si `RANKING_URL` (en `src/config.js`) está vacío, el ranking queda apagado: la pestaña **Ranking** muestra «Muy pronto» y no se envía ningún dato.

## Cómo funciona

- **Puntos:** al terminar una partida se suman al jugador: Trivia, La banda y Completá la frase `aciertos × 10` (hasta 100); Sopa y Crucigrama su puntaje (hasta 100); Adivinanzas `puntos × 20` (hasta 60).
- **Identidad:** el alias del perfil + un identificador anónimo de 24 caracteres hexadecimales que se genera una vez en el dispositivo (`localStorage`, clave `ricota_rank_id`). Sin correo ni contraseña. Cambiar de dispositivo o borrar los datos del navegador crea un jugador nuevo.
- **Tablas:** general y una por juego, con los 10 primeros. Al terminar una partida el jugador ve su puesto y cuántos puntos le faltan para entrar al top 10 («¡esforzate, que se puede!»), con un botón para ver la tabla.
- **Backend:** `worker/ranking.js`, un Cloudflare Worker con base D1 (`worker/schema.sql`). Está separado del juego: el despliegue actual (`wrangler.jsonc`) no cambia.

## Costo

Cloudflare Workers (plan gratuito: 100 000 pedidos por día) y D1 (gratuito: 5 GB y 5 millones de lecturas por día). Para un juego de fans alcanza de sobra y no hace falta tarjeta. Verificá los límites vigentes en la documentación de Cloudflare antes de promocionarlo mucho.

## Activarlo (una sola vez, desde esta carpeta)

```bash
npx wrangler login
npx wrangler d1 create ricotero-ranking
```

1. Copiá el `database_id` que imprime el segundo comando y pegalo en `wrangler.ranking.jsonc`.
2. Creá las tablas y desplegá el Worker:

```bash
npx wrangler d1 execute ricotero-ranking -c wrangler.ranking.jsonc --remote --file=worker/schema.sql
npx wrangler deploy -c wrangler.ranking.jsonc
```

3. Wrangler imprime la URL del Worker (por ejemplo `https://ricotero-ranking.<tu-cuenta>.workers.dev`). Pegala en `RANKING_URL` de `src/config.js`, sin barra final.
4. Si el juego usa otro dominio, agregalo en `vars.ORIGENES` de `wrangler.ranking.jsonc` y volvé a desplegar.
5. Hacé commit y push: el juego se redespliega con el ranking activo (la página de Privacidad ya refleja el envío de datos).

Para probar en local: `npx wrangler d1 execute ricotero-ranking -c wrangler.ranking.jsonc --local --file=worker/schema.sql`, después `npx wrangler dev -c wrangler.ranking.jsonc --local --port 8787` y un archivo `.env.local` (no se sube a Git) con `VITE_RANKING_URL=http://localhost:8787`.

## Límites y seguridad

- El servidor valida alias (3 a 18 caracteres, letras, números, espacio, guion), juego, y rechaza más puntos que el máximo de cada juego. Un mismo jugador no puede enviar más de una partida cada 15 segundos. Solo acepta pedidos del navegador desde los orígenes de `ORIGENES`.
- **No es a prueba de tramposos:** los puntos los calcula el navegador, así que alguien con conocimientos puede mandar partidas falsas dentro de esos límites. Para un ranking de amigos y boca a boca alcanza; si empieza a haber abusos, el siguiente paso es sumar Cloudflare Turnstile (también gratis) o validar las respuestas en el servidor.
- Nombres inapropiados: `vars.BLOQUEADAS` en `wrangler.ranking.jsonc` acepta una lista de fragmentos separados por coma que se rechazan. Para sacar a alguien: `npx wrangler d1 execute ricotero-ranking -c wrangler.ranking.jsonc --remote --command "DELETE FROM jugadores WHERE nombre = 'alias'"` (y lo mismo en `puntos` por su `id`).
- Los datos del ranking son públicos (alias y puntos). La política de Privacidad lo aclara cuando el ranking está activo.
