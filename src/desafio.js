// Desafío por link: viaja en el hash de la URL (#/desafio/modo/tema/dificultad/semilla/puntaje),
// así funciona en hosting estático. El link no lleva datos personales.
import { URL_JUEGO } from './config.js'
import datos from './data/datos-ricotero.json'
import { discoTieneJuego } from './sopa.js'
import { hayCrucigrama } from './crucigrama.js'

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

export const nuevaSemilla = () => {
  let s = ''
  while (s.length < 8) s += Math.random().toString(36).slice(2)
  return s.slice(0, 8)
}

function temaValido(modo, tema) {
  if (modo === 'trivia' || modo === 'banda') return /^\d{1,2}$/.test(tema) && Number(tema) >= 1
  if (modo === 'adivinanzas') return RONDAS.includes(tema)
  if (tema === 'todos') return true
  if (!datos.discos.some((d) => d.id === tema)) return false
  return modo === 'sopa' ? discoTieneJuego(tema) : hayCrucigrama(tema)
}

// Devuelve el desafío validado o null (nunca lanza error).
export function leerDesafio(hash = typeof location !== 'undefined' ? location.hash : '') {
  try {
    if (typeof hash !== 'string' || !hash.startsWith(PREFIJO) || hash.length > 120) return null
    const partes = hash.slice(PREFIJO.length).split('/')
    if (partes.length !== 5) return null
    const [modo, tema, dif, semilla, puntaje] = partes
    if (!Object.hasOwn(MODOS_DESAFIO, modo)) return null
    if (!temaValido(modo, tema)) return null
    if (!DIFICULTADES.includes(dif)) return null
    if (!SEMILLA.test(semilla)) return null
    if (!/^\d{1,3}$/.test(puntaje) || Number(puntaje) > MODOS_DESAFIO[modo].max) return null
    return { modo, tema, dif, semilla, puntaje: Number(puntaje) }
  } catch {
    return null
  }
}

export function crearLink({ modo, tema, dif, semilla, puntaje }) {
  return `${URL_JUEGO}/${PREFIJO}${modo}/${tema}/${dif}/${semilla}/${puntaje}`
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
