// Los 6 temas con los que se clasifican las canciones (campo "temas" de datos-ricotero.json).
import datos from './data/datos-ricotero.json'

export const TEMAS = [
  { id: 'politica', nombre: 'Política y sociedad', icono: '🏛️', color: 'var(--t-politica)' },
  { id: 'amor', nombre: 'Amor y desamor', icono: '💔', color: 'var(--t-amor)' },
  { id: 'noche', nombre: 'Noche y bajos fondos', icono: '🌙', color: 'var(--t-noche)' },
  { id: 'rock', nombre: 'Rock y música', icono: '🎸', color: 'var(--t-rock)' },
  { id: 'personajes', nombre: 'Personajes y relatos', icono: '🎭', color: 'var(--t-personajes)' },
  { id: 'vida', nombre: 'Vida, muerte y existencia', icono: '✨', color: 'var(--t-vida)' },
]

export const esTemaValido = (id) => id === 'todos' || TEMAS.some((t) => t.id === id)
export const nombreDeTema = (id) => TEMAS.find((t) => t.id === id)?.nombre ?? 'Todos los temas'

// ¿La canción pertenece al tema? ('todos' siempre cumple)
export function cumpleTema(cancion, tema) {
  if (tema === 'todos') return true
  const nombre = nombreDeTema(tema)
  return Array.isArray(cancion.temas) && cancion.temas.includes(nombre)
}

// Canciones con palabras verificadas del disco y tema elegidos.
export function cancionesFiltradas(disco = 'todos', tema = 'todos') {
  return datos.canciones.filter(
    (c) => c.palabras_verificadas && (disco === 'todos' || c.disco === disco) && cumpleTema(c, tema),
  )
}
