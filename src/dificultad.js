import { normalizarLetras } from './letras.js'

// Dificultad según el largo de los títulos. Todo se calcula a partir de los datos.
// "nj" es el nivel de juego: el nivel elegido en trivia y La banda, o el nivel del jugador (por partidas) en el resto.

export const MAX_NJ = 5
const letra = /\p{L}/u

export function medidasTitulo(titulo) {
  const palabras = titulo.split(/\s+/).filter((w) => letra.test(w)).length
  const letras = [...titulo].filter((ch) => letra.test(ch)).length
  return { palabras, letras }
}

// 1: hasta 2 palabras o 10 letras · 2: 3 o 4 palabras y hasta 20 letras · 3: 5 o 6 palabras · 4: 7 o más
export function nivelTitulo(titulo) {
  const { palabras, letras } = medidasTitulo(titulo)
  if (palabras >= 7) return 4
  if (palabras >= 5) return 3
  if (palabras <= 2 || letras <= 10) return 1
  return letras <= 20 ? 2 : 3
}

// Jugador sin partidas: nivel 1 (solo títulos de nivel 1 y 2). Sube una etapa cada 4 partidas.
export const nivelJugador = (estado) => Math.min(MAX_NJ, 1 + Math.floor((estado?.partidas ?? 0) / 4))

// Nivel de título más alto permitido. El 4 nunca aparece en Casual.
export function techoTitulo(dif, nj) {
  if (dif === 'fanatico') return nj >= 5 ? 4 : nj >= 2 ? 3 : 2
  return nj >= 3 ? 3 : 2
}

// Probabilidad de que un título de ese nivel entre en el pozo: los largos ganan peso de a poco.
export function probabilidadTitulo(nivel, dif, nj) {
  const techo = techoTitulo(dif, nj)
  if (nivel <= 2) return 1
  if (nivel > techo) return 0
  const umbral = dif === 'fanatico' ? (nivel === 3 ? 2 : 5) : 3
  return Math.min(1, 0.3 + 0.2 * (nj - umbral))
}

export const perfilDePlan = (plan, dif) => (plan?.nj ? { dif: dif === 'fanatico' ? 'fanatico' : 'casual', nj: plan.nj } : null)

// Filtra una lista de elementos con título según el perfil (sin perfil no toca nada).
// Si queda muy corta, se queda con los permitidos sin sorteo y, en último caso, con los de nivel 1 y 2.
export function filtrarPorTitulo(lista, tituloDe, perfil, azar, minimo = 6) {
  if (!perfil) return lista
  const { dif, nj } = perfil
  const sorteados = lista.filter((x) => azar.rnd() < probabilidadTitulo(nivelTitulo(tituloDe(x)), dif, nj))
  if (sorteados.length >= minimo) return sorteados
  const techo = techoTitulo(dif, nj)
  const permitidos = lista.filter((x) => nivelTitulo(tituloDe(x)) <= Math.min(techo, 3))
  if (permitidos.length >= minimo) return permitidos
  const faciles = lista.filter((x) => nivelTitulo(tituloDe(x)) <= 2)
  return faciles.length ? faciles : lista
}

// Largo de palabra para sopa y crucigrama: cortas y comunes al comienzo, largas en niveles o dificultades altas.
export function rangoPalabras(dif, nj) {
  if (dif === 'fanatico') return nj < 2 ? [5, 8] : nj < 4 ? [4, 10] : [4, 13]
  return nj < 3 ? [5, 7] : nj < 5 ? [4, 9] : [4, 13]
}

// Separa las que entran en el rango (mezcladas) de las demás; las cortas, más comunes, van primero dentro del rango.
export function ordenarPorRango(lista, largoDe, rango, azar) {
  const dentro = lista.filter((p) => largoDe(p) >= rango[0] && largoDe(p) <= rango[1])
  return { dentro: azar.mezclar(dentro), fuera: azar.mezclar(lista.filter((p) => !dentro.includes(p))) }
}

// Palabras de una canción de la más distintiva (en menos canciones) a la menos; las del título quedan al final.
const frecuencias = new WeakMap()
export function ordenarDistintivas(cancion, todas, azar) {
  if (!frecuencias.has(todas)) {
    const m = new Map()
    for (const c of todas) for (const p of new Set(c.palabras.map(normalizarLetras))) m.set(p, (m.get(p) ?? 0) + 1)
    frecuencias.set(todas, m)
  }
  const frec = frecuencias.get(todas)
  const enTitulo = new Set(cancion.titulo.split(/\s+/).map((w) => normalizarLetras(w.replace(/[^\p{L}]/gu, ''))))
  const clave = (p) => (enTitulo.has(normalizarLetras(p)) ? 1000 : 0) + (frec.get(normalizarLetras(p)) ?? 0)
  return azar.mezclar(cancion.palabras).sort((a, b) => clave(a) - clave(b))
}
