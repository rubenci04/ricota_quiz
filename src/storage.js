// Progreso y preferencias: se leen una sola vez al iniciar y viven en memoria.
const CLAVE = 'ricota_quiz'
const CLAVE_SONIDO_ANTERIOR = 'ricota_quiz_sonido' // versión previa guardaba el sonido aparte
const VERSION = 3

// n: número entero >= min · b: booleano · s: texto entre valores válidos
const ESQUEMA = {
  nivel: { tipo: 'n', def: 1, min: 1 },
  mejor: { tipo: 'n', def: 0, min: 0 },
  sopas: { tipo: 'n', def: 0, min: 0 },
  adivinanzas: { tipo: 'n', def: 0, min: 0 },
  racha: { tipo: 'n', def: 0, min: 0 }, // lo usa el Ahorcado (hoy fuera del menú)
  nivelBanda: { tipo: 'n', def: 1, min: 1 },
  mejorBanda: { tipo: 'n', def: 0, min: 0 },
  crucigramas: { tipo: 'n', def: 0, min: 0 },
  sonido: { tipo: 'b', def: true },
  vibracion: { tipo: 'b', def: true },
  tutorial: { tipo: 'b', def: false },
  dificultad: { tipo: 's', def: 'casual', validos: ['casual', 'fanatico'] },
}

function validar(crudo) {
  const origen = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? crudo : {}
  const limpio = {}
  for (const [campo, regla] of Object.entries(ESQUEMA)) {
    const v = origen[campo]
    if (regla.tipo === 'n') limpio[campo] = Number.isFinite(v) ? Math.max(regla.min, Math.floor(v)) : regla.def
    else if (regla.tipo === 'b') limpio[campo] = typeof v === 'boolean' ? v : regla.def
    else limpio[campo] = regla.validos.includes(v) ? v : regla.def
  }
  return limpio
}

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null')
    const estado = validar(guardado)
    // migración: el sonido se guardaba en otra clave
    if (!guardado || typeof guardado.sonido !== 'boolean') {
      if (localStorage.getItem(CLAVE_SONIDO_ANTERIOR) === 'off') estado.sonido = false
    }
    return estado
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
