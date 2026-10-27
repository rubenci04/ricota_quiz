import { crearAzar } from './azar.js'

// Ayuda de entrada gratuita y reproducible: no consume pistas ni puntos.
export function prepararLetras(grupos, dificultad, semilla) {
  const solucion = grupos.flatMap(g => g.letras)
  let posicion = 0
  const palabras = grupos.map(g => {
    const inicio = posicion
    posicion += g.letras.length
    return { inicio, largo: g.letras.length }
  }).filter(g => g.largo > 0)
  const casual = dificultad !== 'fanatico'
  const cantidad = Math.min(solucion.length, Math.max(casual ? 2 : 1, Math.round(solucion.length * (casual ? 0.4 : 0.15))))
  const azar = crearAzar(`iniciales-${semilla}`)
  const obligatorias = casual ? palabras.map(g => g.inicio)
    : azar.mezclar(palabras).sort((a,b) => b.largo-a.largo).slice(0,1).map(g => g.inicio)
  const otras = azar.mezclar(solucion.map((_,i) => i).filter(i => !obligatorias.includes(i)))
  const elegidas = new Set([...obligatorias, ...otras.slice(0, Math.max(0,cantidad-obligatorias.length))])
  const iniciales = solucion.map((_,i) => elegidas.has(i))
  return { letras: solucion.map((l,i) => iniciales[i] ? l : ''), fijas: iniciales, iniciales,
    foco: Math.max(0, iniciales.findIndex(f => !f)) }
}
