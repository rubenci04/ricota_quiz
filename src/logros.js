// Logros: nombres y descripciones propias (sin versos ni citas). Se calculan sobre el progreso guardado.
import { guardar, leer, MODOS_JUGABLES, suscribir } from './storage.js'
import { fechaBA } from './reto.js'

export const LOGROS = [
  { id: 'primera', nombre: 'Primer pogo', descripcion: 'Terminá tu primera partida, en cualquier modo.', ok: (e) => e.partidas >= 1 },
  { id: 'trivia5', nombre: 'Fanático de ley', descripcion: 'Superá el nivel 5 de la trivia.', ok: (e) => e.nivel >= 6 },
  { id: 'perfecta', nombre: 'Cero fallas', descripcion: 'Sacá 10 de 10 en una trivia.', ok: (e) => e.mejor >= 10 || e.mejorBanda >= 10 },
  { id: 'banda3', nombre: 'Culto del under', descripcion: 'Superá el nivel 3 de La banda.', ok: (e) => e.nivelBanda >= 4 },
  { id: 'sopaSola', nombre: 'Ojo de halcón', descripcion: 'Completá una sopa de letras sin usar pistas.', ok: (e) => e.sopaSinPistas },
  { id: 'sopa5', nombre: 'Sopero oficial', descripcion: 'Completá 5 sopas de letras.', ok: (e) => e.sopas >= 5 },
  { id: 'cruci', nombre: 'Crucigramista de cabecera', descripcion: 'Completá un crucigrama.', ok: (e) => e.crucigramas >= 1 },
  { id: 'adivina', nombre: 'Oído fino', descripcion: 'Adiviná una canción sin pedir pistas de letra.', ok: (e) => e.adivinanzaSinPistas },
  { id: 'reto', nombre: 'Detective del día', descripcion: 'Ganá un reto del día.', ok: (e) => e.retosGanados >= 1 },
  { id: 'racha3', nombre: 'Constante', descripcion: 'Jugá el reto del día 3 días seguidos.', ok: (e) => e.rachaMax >= 3 },
  { id: 'racha7', nombre: 'Semana redonda', descripcion: 'Jugá el reto del día 7 días seguidos.', ok: (e) => e.rachaMax >= 7 },
  { id: 'racha30', nombre: 'Mes de culto', descripcion: 'Jugá el reto del día 30 días seguidos.', ok: (e) => e.rachaMax >= 30 },
  { id: 'todoterreno', nombre: 'Todoterreno', descripcion: 'Probá todos los modos de juego.', ok: (e) => MODOS_JUGABLES.every((m) => e.modosProbados.includes(m)) },
]

const avisos = new Set()
let revisando = false

// Quienes quieran mostrar el aviso de un logro nuevo se suscriben acá.
export function alDesbloquear(fn) {
  avisos.add(fn)
  return () => avisos.delete(fn)
}

// Compara el progreso con los logros y guarda los nuevos. Devuelve los recién desbloqueados.
export function revisarLogros() {
  if (revisando) return []
  revisando = true
  try {
    const e = leer()
    const nuevos = LOGROS.filter((l) => !e.logros[l.id] && l.ok(e))
    if (nuevos.length) {
      const hoy = fechaBA()
      guardar({ logros: { ...e.logros, ...Object.fromEntries(nuevos.map((l) => [l.id, hoy])) } })
      for (const l of nuevos) for (const fn of avisos) fn(l)
    }
    return nuevos
  } finally {
    revisando = false
  }
}

// Cada cambio de progreso dispara la revisión.
export function iniciarLogros() {
  revisarLogros()
  return suscribir(revisarLogros)
}
