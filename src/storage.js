const CLAVE = 'ricota_quiz'
const BASE = { nivel: 1, mejor: 0, sopas: 0, adivinanzas: 0, racha: 0, nivelBanda: 1, mejorBanda: 0 }

export function leer() {
  try {
    return { ...BASE, ...JSON.parse(localStorage.getItem(CLAVE) || '{}') }
  } catch {
    return { ...BASE }
  }
}

export function guardar(cambios) {
  const nuevo = { ...leer(), ...cambios }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  } catch {
    // sin almacenamiento: se juega igual
  }
  return nuevo
}

export function sumarSopa() {
  guardar({ sopas: leer().sopas + 1 })
}
