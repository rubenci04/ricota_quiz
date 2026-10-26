import { crearAzar } from './azar.js'

const CORTAS = new Set(['EL', 'LA', 'LOS', 'LAS', 'UN', 'UNA', 'UNOS', 'UNAS', 'DE', 'DEL', 'AL', 'A', 'EN', 'CON', 'SIN', 'POR', 'PARA', 'DESDE', 'HASTA', 'ENTRE', 'SOBRE', 'COMO', 'CONTRA', 'Y', 'O'])

// nivelTitulo (1 a 4): cuanto más largo el título, más letras puestas.
export function prepararLetras(grupos, dificultad, semilla, nivelTitulo = 1) {
  const solucion = grupos.flatMap((g) => g.letras)
  const base = Math.max(0, (grupos.length >= 6 || solucion.length >= 25 ? 2 : grupos.length >= 4 || solucion.length >= 15 ? 1 : 0) - (dificultad === 'fanatico' ? 1 : 0))
  const cantidad = base + (nivelTitulo >= 3 ? 1 + (nivelTitulo >= 4 ? 2 : 0) : 0)
  const azar = crearAzar(`iniciales-${semilla}`)
  let posicion = 0
  const largas = grupos.map((g) => {
    const inicio = posicion
    posicion += g.letras.length
    return { inicio, letras: g.letras }
  }).filter((g) => g.letras.length > 1 && !CORTAS.has(g.letras.join('')))
  const primeras = azar.mezclar(largas).sort((a, b) => b.letras.length - a.letras.length).map((g) => g.inicio)
  const otras = azar.mezclar(largas.flatMap((g) => g.letras.slice(1).map((_, i) => g.inicio + i + 1)))
  const elegidas = new Set([...primeras, ...otras].slice(0, cantidad))
  const iniciales = solucion.map((_, i) => elegidas.has(i))
  return { letras: solucion.map((l, i) => iniciales[i] ? l : ''), fijas: iniciales, iniciales,
    foco: iniciales.findIndex((f) => !f) }
}
