// Progreso guardado: se lee una sola vez al iniciar y vive en memoria.
const CLAVE = 'ricota_quiz'
const VERSION = 2

// campo: [valor por defecto, mínimo]
const ESQUEMA = {
  nivel: [1, 1],
  mejor: [0, 0],
  sopas: [0, 0],
  adivinanzas: [0, 0],
  racha: [0, 0], // lo usa el Ahorcado (hoy fuera del menú)
  nivelBanda: [1, 1],
  mejorBanda: [0, 0],
}

function validar(crudo) {
  const origen = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? crudo : {}
  const limpio = {}
  for (const [campo, [defecto, minimo]] of Object.entries(ESQUEMA)) {
    const n = origen[campo]
    limpio[campo] = Number.isFinite(n) ? Math.max(minimo, Math.floor(n)) : defecto
  }
  return limpio
}

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null')
    // v1 (sin versión) y v2 comparten campos: se migran validando cada uno
    return validar(guardado)
  } catch {
    return validar(null)
  }
}

let estado = cargar()

export function leer() {
  return { ...estado }
}

export function guardar(cambios) {
  estado = validar({ ...estado, ...cambios })
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ v: VERSION, ...estado }))
  } catch {
    // sin almacenamiento: se juega igual con el estado en memoria
  }
  return { ...estado }
}

export function sumarSopa() {
  guardar({ sopas: estado.sopas + 1 })
}
