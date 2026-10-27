// Desafío por link: viaja en el hash de la URL, así funciona en hosting estático.
//   #/desafio/trivia|banda/<nivel>[.<tema>]/<dificultad>/<semilla>/<puntaje>
//   #/desafio/sopa|crucigrama/<disco>[.<tema>]/<dificultad>/<semilla>/<puntaje>
//   #/desafio/adivinanzas/<ronda>[.<disco>[.<tema>]]/<dificultad>/<semilla>/<puntaje>
// Los links anteriores (sin tema) siguen funcionando. El link no lleva datos personales.
import { URL_JUEGO, NOMBRE_JUEGO } from './config.js'
import datos from './data/datos-ricotero.json'
import { TOKENS } from './adivinanza.js'
import { esTemaValido } from './temas.js'
import { triviaTieneTema } from './trivia.js'
import { LIMITES } from './niveles.js'

const PREFIJO = '#/desafio/'

export const MODOS_DESAFIO = {
  frases: { max: 10, formato: p => `${p}/10`, descripcion: 'Completá la frase' },
  trivia: { max: 10, formato: (p) => `${p}/10`, descripcion: 'la trivia' },
  banda: { max: 10, formato: (p) => `${p}/10`, descripcion: 'La banda, la trivia de nicho' },
  sopa: { max: 100, formato: (p) => `${p} puntos`, descripcion: 'una sopa de letras' },
  crucigrama: { max: 100, formato: (p) => `${p} puntos`, descripcion: 'un crucigrama' },
  adivinanzas: { max: 3, formato: (p) => `${p} ${p === 1 ? 'punto' : 'puntos'}`, descripcion: 'una adivinanza' },
}

const DIFICULTADES = ['casual', 'fanatico']
const SEMILLA = /^[a-z0-9]{4,16}$/
const esDisco = (id) => id === 'todos' || datos.discos.some((d) => d.id === id)

export { nuevaSemilla } from './azar.js'

// Interpreta el segmento "tema" según el modo. Devuelve los campos o null si no es válido.
function leerSegmento(modo, segmento) {
  if (modo === 'frases') return segmento === 'todos.todos' ? { disco: 'todos', tema: 'todos' } : null
  const p = segmento.split('.')
  if (p.some((x) => !/^[a-z0-9]{1,20}$/.test(x))) return null
  if (modo === 'trivia' || modo === 'banda') {
    const [nivel, tema = 'todos', version] = p
    if (p.length > 3 || (version !== undefined && version !== 'v2') || !/^\d{1,2}$/.test(nivel) || Number(nivel) < 1 || !esTemaValido(tema)) return null
    if (version === 'v2' && Number(nivel) > LIMITES[modo]) return null
    if (modo === 'banda' && tema !== 'todos') return null
    if (!triviaTieneTema(tema)) return null
    return { nivel: Number(nivel), tema, disco: 'todos', version: version === 'v2' ? 2 : 1 }
  }
  if (modo === 'adivinanzas') {
    const [ronda, disco = 'todos', tema = 'todos'] = p
    if (p.length > 3 || !TOKENS.includes(ronda) || !esDisco(disco) || !esTemaValido(tema)) return null
    return { ronda, disco, tema }
  }
  const [disco, tema = 'todos'] = p // sopa y crucigrama
  if (p.length > 2 || !esDisco(disco) || !esTemaValido(tema)) return null
  const hay = true // sin datos suficientes, la partida se completa con otras canciones
  return hay ? { disco, tema } : null
}

// Devuelve el desafío validado o null (nunca lanza error).
export function leerDesafio(hash = typeof location !== 'undefined' ? location.hash : '') {
  try {
    if (typeof hash !== 'string' || !hash.startsWith(PREFIJO) || hash.length > 20000) return null
    const partes = hash.slice(PREFIJO.length).split('/')
    if (partes.length !== 5 && partes.length !== 7) return null
    const [modo, segmento, dif, semilla, puntaje] = partes
    if (!Object.hasOwn(MODOS_DESAFIO, modo)) return null
    const extra = leerSegmento(modo, segmento)
    if (!extra) return null
    if (!DIFICULTADES.includes(dif)) return null
    if (!SEMILLA.test(semilla)) return null
    if (!/^\d{1,3}$/.test(puntaje) || Number(puntaje) > MODOS_DESAFIO[modo].max) return null
    let plan
    if (partes.length === 7) {
      if (partes[5] !== 'v3') return null
      plan = JSON.parse(atob(partes[6].replace(/-/g, '+').replace(/_/g, '/')))
      if (!plan || typeof plan !== 'object') return null
      for (const [k, max] of [['vistos', 150], ['recientes', 150], ['ciclo', 1000]]) {
        if (!Array.isArray(plan[k]) || plan[k].length > max || plan[k].some((id) => typeof id !== 'string' || !/^[a-z0-9:_-]{1,40}$/i.test(id))) return null
      }
      plan = { vistos: plan.vistos, recientes: plan.recientes, ciclo: plan.ciclo, ...(Number.isInteger(plan.nj) && plan.nj >= 1 && plan.nj <= 5 ? { nj: plan.nj } : {}), ...(modo === 'adivinanzas' && plan.reglasAdivinanza === 2 ? { reglasAdivinanza: 2 } : {}) }
      if ((modo === 'trivia' || modo === 'banda') && extra.nivel > LIMITES[modo]) return null
    }
    return { modo, ...extra, dif, semilla, puntaje: Number(puntaje), ...(plan ? { plan, version: 3 } : {}) }
  } catch {
    return null
  }
}

function segmentoDe(d) {
  if (d.modo === 'trivia' || d.modo === 'banda') return `${d.nivel}.${d.tema ?? 'todos'}${d.version === 2 ? '.v2' : ''}`
  if (d.modo === 'adivinanzas') return `${d.ronda}.${d.disco ?? 'todos'}.${d.tema ?? 'todos'}`
  return `${d.disco ?? 'todos'}.${d.tema ?? 'todos'}`
}

export function crearLink(d) {
  const plan = d.plan ? `/v3/${btoa(JSON.stringify({ vistos: d.plan.vistos, recientes: d.plan.recientes, ciclo: d.plan.ciclo, ...(d.plan.nj ? { nj: d.plan.nj } : {}), ...(d.modo === 'adivinanzas' && d.plan.reglasAdivinanza === 2 ? { reglasAdivinanza: 2 } : {}) })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}` : ''
  return `${URL_JUEGO}/${PREFIJO}${d.modo}/${segmentoDe(d)}/${d.dif}/${d.semilla}/${d.puntaje}${plan}`
}

export function textoDesafio(d) {
  const m = MODOS_DESAFIO[d.modo]
  return `${NOMBRE_JUEGO}: te desafío en ${m.descripcion}: hice ${m.formato(d.puntaje)}. ¿Podés superarme? 🎸`
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
