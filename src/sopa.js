import datos from './data/datos-ricotero.json'
import { crearAzar } from './azar.js'
import { cumpleTema } from './temas.js'

export const SIZE = 12
const MIN_LEN = 4
const DIRS = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1],
]

export const discos = datos.discos

export function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

// azar de la generación en curso (con semilla si se pidió una)
let R = crearAzar()
const mezclar = (arr) => R.mezclar(arr)

// Palabras únicas (por forma normalizada) de las canciones del disco elegido.
export function palabrasDisponibles(discoId, tema = 'todos') {
  const mapa = new Map()
  for (const c of datos.canciones) {
    if (!c.palabras_verificadas) continue
    if (discoId !== 'todos' && c.disco !== discoId) continue
    if (!cumpleTema(c, tema)) continue
    for (const p of c.palabras) {
      const norm = normalizar(p)
      if (norm.length >= MIN_LEN && norm.length <= SIZE && !mapa.has(norm)) {
        mapa.set(norm, { original: p, norm, cancion: c.titulo })
      }
    }
  }
  return [...mapa.values()]
}

// Ningún disco queda sin jugar: si el disco (y tema) elegido tiene pocas palabras, la partida se
// completa con otras canciones (primero del mismo tema) y se avisa con "completada".
const MIN_PALABRAS_PARTIDA = 8
export function poolSopa(discoId, tema = 'todos') {
  const propias = palabrasDisponibles(discoId, tema)
  if (propias.length >= MIN_PALABRAS_PARTIDA) return { propias, extras: [], completada: false }
  const vistas = new Set(propias.map((p) => p.norm))
  const extras = []
  for (const origen of [palabrasDisponibles('todos', tema), palabrasDisponibles('todos', 'todos')]) {
    for (const p of origen) {
      if (!vistas.has(p.norm)) {
        vistas.add(p.norm)
        extras.push(p)
      }
    }
    if (propias.length + extras.length >= 14) break
  }
  return { propias, extras, completada: true }
}

// compatibilidad: ya no hay discos deshabilitados por falta de datos
export const discoTieneJuego = () => true

function intentarGrilla(candidatas, cantidad) {
  const grilla = Array.from({ length: SIZE }, () => Array(SIZE).fill(''))
  const puestas = []
  for (const palabra of candidatas) {
    if (puestas.length >= cantidad) break
    if (puestas.some((p) => p.norm.includes(palabra.norm) || palabra.norm.includes(p.norm))) continue
    const len = palabra.norm.length
    for (let intento = 0; intento < 80; intento++) {
      const [dr, dc] = DIRS[R.entero(DIRS.length)]
      const r0 = R.entero(SIZE)
      const c0 = R.entero(SIZE)
      const rf = r0 + dr * (len - 1)
      const cf = c0 + dc * (len - 1)
      if (rf < 0 || rf >= SIZE || cf < 0 || cf >= SIZE) continue
      let ok = true
      for (let i = 0; i < len; i++) {
        const celda = grilla[r0 + dr * i][c0 + dc * i]
        if (celda && celda !== palabra.norm[i]) { ok = false; break }
      }
      if (!ok) continue
      for (let i = 0; i < len; i++) grilla[r0 + dr * i][c0 + dc * i] = palabra.norm[i]
      puestas.push({ ...palabra, r0, c0, dr, dc })
      break
    }
  }
  return { grilla, puestas }
}

function generarPartida(discoId, tema) {
  const { propias, extras, completada } = poolSopa(discoId, tema)
  const cantidad = Math.min(propias.length + extras.length, 8 + R.entero(3))
  let mejor = null
  for (let i = 0; i < 20; i++) {
    // las palabras del disco elegido van primero; las de relleno, después
    const res = intentarGrilla([...mezclar(propias), ...mezclar(extras)], cantidad)
    if (!mejor || res.puestas.length > mejor.puestas.length) mejor = res
    if (res.puestas.length >= cantidad) break
  }
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let grilla
  // el relleno al azar no debe formar una segunda copia de ninguna palabra
  for (let i = 0; i < 60; i++) {
    grilla = mejor.grilla.map((fila) =>
      fila.map((x) => x || letras[R.entero(letras.length)]),
    )
    if (mejor.puestas.every((p) => contarApariciones(grilla, p.norm) === 1)) break
  }
  return { grilla, palabras: mejor.puestas, completada }
}

function contarApariciones(grilla, norm) {
  const alReves = [...norm].reverse().join('')
  let n = 0
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      for (const [dr, dc] of DIRS) {
        const rf = r + dr * (norm.length - 1)
        const cf = c + dc * (norm.length - 1)
        if (rf < 0 || rf >= SIZE || cf < 0 || cf >= SIZE) continue
        let ok = true
        for (let i = 0; i < norm.length; i++) {
          if (grilla[r + dr * i][c + dc * i] !== norm[i]) { ok = false; break }
        }
        if (ok) n++
      }
    }
  }
  return norm === alReves ? n / 2 : n
}

// Con la misma semilla y disco da siempre la misma partida; sin semilla es al azar.
export function nuevaPartida(discoId, semilla, tema = 'todos') {
  R = crearAzar(semilla)
  try {
    return generarPartida(discoId, tema)
  } finally {
    R = crearAzar()
  }
}
