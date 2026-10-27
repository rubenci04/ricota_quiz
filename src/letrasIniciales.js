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

// Dicho de otra forma: retira una letra de ayuda de cada palabra que la tenía.
// Así tampoco quedan resueltas de entrada las palabras cortas del título.
export function prepararLetrasDicho(grupos,dificultad,semilla) {
  const ayuda=prepararLetras(grupos,dificultad,semilla)
  let inicio=0
  for(const grupo of grupos){
    const fin=inicio+grupo.letras.length
    const quitar=ayuda.iniciales.findIndex((f,i)=>f&&i>=inicio&&i<fin)
    if(quitar>=0){ayuda.letras[quitar]='';ayuda.fijas[quitar]=false;ayuda.iniciales[quitar]=false}
    inicio=fin
  }
  ayuda.foco=Math.max(0,ayuda.fijas.findIndex(f=>!f))
  return ayuda
}
