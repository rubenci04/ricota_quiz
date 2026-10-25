// Los 6 temas con los que se clasifican las canciones (campo "temas" de datos-ricotero.json).
import datos from './data/datos-ricotero.json'

export const TEMAS = [
  { id: 'politica', nombre: 'Política y sociedad' },
  { id: 'amor', nombre: 'Amor y desamor' },
  { id: 'noche', nombre: 'Noche y bajos fondos' },
  { id: 'rock', nombre: 'Rock y música' },
  { id: 'personajes', nombre: 'Personajes y relatos' },
  { id: 'vida', nombre: 'Vida, muerte y existencia' },
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
