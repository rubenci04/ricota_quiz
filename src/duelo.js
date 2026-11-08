// Reglas del modo por turnos (amigos en el mismo dispositivo o contra la CPU).
import { armarNivel, armarNivelBanda, clavePregunta } from './trivia.js'
import { crearAzar } from './azar.js'

export const TIEMPO_BASE = 20
export const COLORES_JUGADOR = ['#e11d48', '#0ea5e9', '#10b981', '#f59e0b']
export const NIVELES_CPU = [
  { id: 'facil', nombre: 'Fácil', acierto: 0.45 },
  { id: 'normal', nombre: 'Normal', acierto: 0.68 },
  { id: 'ricotero', nombre: 'Ricotero', acierto: 0.88 },
]

// Cada porción de la ruleta de la suerte cambia la pregunta de ese turno.
export const SUERTES = [
  { id: 'doble', texto: 'Puntos x2', icono: '✨', color: '#f59e0b', detalle: '¡Doble puntaje si acertás!' },
  { id: 'mitad', texto: '50/50', icono: '✂️', color: '#0ea5e9', detalle: 'Te sacamos dos opciones incorrectas.' },
  { id: 'tiempo', texto: '+10 seg', icono: '⏱️', color: '#10b981', detalle: 'Tenés diez segundos extra.' },
  { id: 'triple', texto: 'Triple o nada', icono: '🎲', color: '#e11d48', detalle: 'Triple si acertás… pero si fallás perdés 5 puntos.' },
  { id: 'rock', texto: '+5 gratis', icono: '🤘', color: '#7c3aed', detalle: '5 puntos de regalo, vengas como vengas.' },
  { id: 'normal', texto: 'Normal', icono: '🎸', color: '#64748b', detalle: 'Pregunta sin vueltas.' },
]

// Preguntas distintas para toda la partida, tomadas de los bancos de Trivia.
export function armarPreguntas(total, categoria, semilla) {
  const vistas = new Set()
  const salida = []
  for (let k = 0; salida.length < total && k < 40; k++) {
    const nivel = (k % 3) + 1
    const lote = categoria === 'banda'
      ? armarNivelBanda(nivel, `${semilla}-${k}`, 3, undefined, 'casual')
      : armarNivel(nivel, `${semilla}-${k}`, 'todos', 3, undefined, 'casual')
    for (const p of crearAzar(`${semilla}-m${k}`).mezclar(lote)) {
      const c = clavePregunta(p)
      if (vistas.has(c)) continue
      vistas.add(c)
      salida.push(p)
      if (salida.length >= total) break
    }
  }
  return salida
}

// Porciones de una ruleta con al menos 6 casillas, repartidas parejo entre los jugadores.
export function porcionesDeJugadores(jugadores) {
  const vueltas = Math.max(1, Math.ceil(6 / jugadores.length))
  return Array.from({ length: vueltas * jugadores.length }, (_, i) => {
    const j = jugadores[i % jugadores.length]
    return { texto: j.nombre, icono: j.cpu ? '🤖' : '🎤', color: j.color, id: j.id }
  })
}

export function puntosPorAcierto({ restante, racha, suerte }) {
  const base = 10 + Math.ceil(Math.max(0, restante) / 2) + Math.min(racha, 4) * 2
  return base * (suerte === 'doble' ? 2 : suerte === 'triple' ? 3 : 1)
}

export function puntosPorFallo(suerte) {
  return suerte === 'triple' ? -5 : 0
}

export function elegirRespuestaCpu(pregunta, acierto, rnd = Math.random) {
  if (rnd() < acierto) return pregunta.correcta
  const malas = pregunta.opciones.map((_, i) => i).filter((i) => i !== pregunta.correcta)
  return malas[Math.floor(rnd() * malas.length)]
}

// Ranking con empates: devuelve los ganadores (puede haber más de uno).
export function ganadores(jugadores) {
  const max = Math.max(...jugadores.map((j) => j.puntos))
  return jugadores.filter((j) => j.puntos === max)
}
