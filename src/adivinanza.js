import datos from './data/datos-ricotero.json'
import { normalizarLetras } from './letras.js'
import { crearAzar } from './azar.js'
import { cumpleTema } from './temas.js'

export const cancionesConPalabras = datos.canciones.filter((c) => c.palabras_verificadas && c.palabras.length >= 3)

// La Ñ se muestra como Ñ pero se acepta como N.
export const clave = (l) => (l === 'Ñ' ? 'N' : l)
export const mismaLetra = (a, b) => clave(a) === clave(b)

// Una casilla por letra del título completo, agrupadas por palabra; el guion separa grupos y se ve.
export function armarCasillas(titulo) {
  return titulo
    .split(/\s+/)
    .flatMap((pal) =>
      pal.split('-').map((parte, i, partes) => ({
        letras: [...parte].filter((ch) => /\p{L}/u.test(ch)).map(normalizarLetras),
        guionDespues: i < partes.length - 1,
      })),
    )
    .filter((g) => g.letras.length > 0)
}

export function rondaDeCancion(c, azar) {
  const grupos = armarCasillas(c.titulo)
  return {
    cancion: c,
    claves: azar.mezclar(c.palabras),
    grupos,
    solucion: grupos.flatMap((g) => g.letras),
  }
}

// Con la misma semilla y modo da siempre la misma ronda; sin semilla es al azar.
function poolDe(modo, disco, tema) {
  // el modo por palabras usa solo canciones con palabras verificadas
  const base = modo === 'parafraseado' ? datos.canciones.filter((c) => c.titulo_parafraseado) : cancionesConPalabras
  return base.filter((c) => (disco === 'todos' || c.disco === disco) && cumpleTema(c, tema))
}

// ¿Hay canciones suficientes para jugar con ese modo, disco y tema?
export const hayRonda = (modo, disco = 'todos', tema = 'todos') => poolDe(modo, disco, tema).length >= 3

export function nuevaRonda(modo, anterior, semilla, disco = 'todos', tema = 'todos') {
  const azar = crearAzar(semilla)
  const pool = poolDe(modo, disco, tema)
  let c
  do {
    c = azar.elegir(pool)
  } while (c === anterior && pool.length > 1)
  return rondaDeCancion(c, azar)
}
