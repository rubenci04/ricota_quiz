// Cliente del ranking online (ver RANKING.md). Con RANKING_URL vacío no hace ningún envío.
import { RANKING_URL } from './config.js'
import { leer } from './storage.js'

export const rankingActivo = Boolean(RANKING_URL)

export const MODOS_RANKING = [
  ['global', '🏅 General'],
  ['frases', '✏️ Frases'],
  ['trivia', '🧠 Trivia'],
  ['banda', '🎸 La banda'],
  ['adivinanzas', '🧩 Adivinanzas'],
  ['sopa', '🔍 Sopa'],
  ['crucigrama', '✍️ Crucigrama'],
]

// puntos que suma una partida terminada (de 0 a 100; adivinanzas, hasta 60)
export function puntosRanking(modo, puntaje) {
  const p = Number(puntaje)
  if (!Number.isFinite(p) || p < 0) return 0
  if (modo === 'trivia' || modo === 'banda' || modo === 'frases') return Math.min(100, Math.round(p * 10))
  if (modo === 'adivinanzas') return Math.min(60, Math.round(p * 20))
  return Math.min(100, Math.round(p))
}

// id anónimo del dispositivo (no es un dato personal): sirve para ubicarte en la tabla
const CLAVE_ID = 'ricota_rank_id'
export function idRanking() {
  try {
    let id = localStorage.getItem(CLAVE_ID)
    if (!/^[a-f0-9]{24}$/.test(id || '')) {
      id = [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(CLAVE_ID, id)
    }
    return id
  } catch {
    return null
  }
}

async function pedir(ruta, opciones = {}) {
  const control = new AbortController()
  const t = setTimeout(() => control.abort(), 7000)
  try {
    const r = await fetch(`${RANKING_URL}${ruta}`, { ...opciones, signal: control.signal })
    return r.ok ? await r.json() : { error: r.status }
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// devuelve { global, modo, puntos } con puesto y corte del top 10, o null si no se pudo
export async function enviarPuntaje(modo, puntaje) {
  const id = idRanking()
  const puntos = puntosRanking(modo, puntaje)
  if (!rankingActivo || !id || puntos <= 0) return null
  const r = await pedir('/api/puntaje', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, nombre: leer().alias, modo, puntos }),
  })
  return r && !r.error ? { ...r, puntos } : null
}

export async function leerTop(modo = 'global') {
  if (!rankingActivo) return null
  const id = idRanking()
  const r = await pedir(`/api/top?modo=${encodeURIComponent(modo)}`, id ? { headers: { 'X-Jugador': id } } : {})
  return r && !r.error ? r : null
}

// mensaje de ánimo según el puesto que devolvió el servidor
export function mensajePuesto({ global: g }) {
  if (g.puesto <= 3) return `🏆 ¡Estás en el podio! Puesto ${g.puesto} de ${g.jugadores} con ${g.puntos} pts. ¡No lo sueltes!`
  if (g.puesto <= 10) return `🔥 ¡Estás en el top 10! Puesto ${g.puesto} de ${g.jugadores} con ${g.puntos} pts. Seguí sumando para subir.`
  const falta = g.corte == null ? 0 : Math.max(1, g.corte - g.puntos + 1)
  return `📈 Estás en el puesto ${g.puesto} de ${g.jugadores} con ${g.puntos} pts. Te faltan ${falta} pts para entrar al top 10: ¡esforzate, que se puede!`
}
