// Desafío por link: viaja en el hash de la URL, así funciona en hosting estático.
//   #/desafio/trivia|banda/<nivel>[.<tema>]/<dificultad>/<semilla>/<puntaje>
//   #/desafio/sopa|crucigrama/<disco>[.<tema>]/<dificultad>/<semilla>/<puntaje>
//   #/desafio/adivinanzas/<ronda>[.<disco>[.<tema>]]/<dificultad>/<semilla>/<puntaje>
// Los links anteriores (sin tema) siguen funcionando. El link no lleva datos personales.
import { URL_JUEGO } from './config.js'
import datos from './data/datos-ricotero.json'
import { discoTieneJuego } from './sopa.js'
import { hayCrucigrama } from './crucigrama.js'
import { hayRonda } from './adivinanza.js'
import { esTemaValido } from './temas.js'
import { triviaTieneTema } from './trivia.js'

const PREFIJO = '#/desafio/'

export const MODOS_DESAFIO = {
  trivia: { max: 10, formato: (p) => `${p}/10`, descripcion: 'la trivia' },
  banda: { max: 10, formato: (p) => `${p}/10`, descripcion: 'La banda, la trivia de nicho' },
  sopa: { max: 100, formato: (p) => `${p} puntos`, descripcion: 'una sopa de letras' },
  crucigrama: { max: 100, formato: (p) => `${p} puntos`, descripcion: 'un crucigrama' },
  adivinanzas: { max: 3, formato: (p) => `${p} ${p === 1 ? 'punto' : 'puntos'}`, descripcion: 'una adivinanza' },
}

const DIFICULTADES = ['casual', 'fanatico']
const RONDAS = ['palabras', 'parafraseado']
const SEMILLA = /^[a-z0-9]{4,16}$/
const esDisco = (id) => id === 'todos' || datos.discos.some((d) => d.id === id)

export const nuevaSemilla = () => {
  let s = ''
  while (s.length < 8) s += Math.random().toString(36).slice(2)
  return s.slice(0, 8)
}

// Interpreta el segmento "tema" según el modo. Devuelve los campos o null si no es válido.
function leerSegmento(modo, segmento) {
  const p = segmento.split('.')
  if (p.some((x) => !/^[a-z0-9]{1,20}$/.test(x))) return null
  if (modo === 'trivia' || modo === 'banda') {
    const [nivel, tema = 'todos'] = p
    if (p.length > 2 || !/^\d{1,2}$/.test(nivel) || Number(nivel) < 1 || !esTemaValido(tema)) return null
    if (modo === 'banda' && tema !== 'todos') return null
    if (!triviaTieneTema(tema)) return null
    return { nivel: Number(nivel), tema, disco: 'todos' }
  }
  if (modo === 'adivinanzas') {
    const [ronda, disco = 'todos', tema = 'todos'] = p
    if (p.length > 3 || !RONDAS.includes(ronda) || !esDisco(disco) || !esTemaValido(tema)) return null
    if (!hayRonda(ronda, disco, tema)) return null
    return { ronda, disco, tema }
  }
  const [disco, tema = 'todos'] = p // sopa y crucigrama
  if (p.length > 2 || !esDisco(disco) || !esTemaValido(tema)) return null
  const hay = modo === 'sopa' ? discoTieneJuego(disco, tema) : hayCrucigrama(disco, tema)
  return hay ? { disco, tema } : null
}

// Devuelve el desafío validado o null (nunca lanza error).
export function leerDesafio(hash = typeof location !== 'undefined' ? location.hash : '') {
  try {
    if (typeof hash !== 'string' || !hash.startsWith(PREFIJO) || hash.length > 140) return null
    const partes = hash.slice(PREFIJO.length).split('/')
    if (partes.length !== 5) return null
    const [modo, segmento, dif, semilla, puntaje] = partes
    if (!Object.hasOwn(MODOS_DESAFIO, modo)) return null
    const extra = leerSegmento(modo, segmento)
    if (!extra) return null
    if (!DIFICULTADES.includes(dif)) return null
    if (!SEMILLA.test(semilla)) return null
    if (!/^\d{1,3}$/.test(puntaje) || Number(puntaje) > MODOS_DESAFIO[modo].max) return null
    return { modo, ...extra, dif, semilla, puntaje: Number(puntaje) }
  } catch {
    return null
  }
}

function segmentoDe(d) {
  if (d.modo === 'trivia' || d.modo === 'banda') return `${d.nivel}.${d.tema ?? 'todos'}`
  if (d.modo === 'adivinanzas') return `${d.ronda}.${d.disco ?? 'todos'}.${d.tema ?? 'todos'}`
  return `${d.disco ?? 'todos'}.${d.tema ?? 'todos'}`
}

export function crearLink(d) {
  return `${URL_JUEGO}/${PREFIJO}${d.modo}/${segmentoDe(d)}/${d.dif}/${d.semilla}/${d.puntaje}`
}

export function textoDesafio(d) {
  const m = MODOS_DESAFIO[d.modo]
  return `Te desafío en ${m.descripcion}: hice ${m.formato(d.puntaje)}. ¿Podés superarme? 🎸`
}

export function comparar(mio, rival) {
  return mio > rival ? 'gana' : mio < rival ? 'pierde' : 'empata'
}

export function limpiarHash() {
  try {
    history.replaceState(null, '', location.pathname + location.search)
  } catch {
    // sin historial: no pasa nada
  }
}
