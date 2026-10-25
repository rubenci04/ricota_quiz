import datos from './data/datos-ricotero.json'

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

function mezclar(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Palabras únicas (por forma normalizada) de las canciones del disco elegido.
export function palabrasDisponibles(discoId) {
  const mapa = new Map()
  for (const c of datos.canciones) {
    if (!c.palabras_verificadas) continue
    if (discoId !== 'todos' && c.disco !== discoId) continue
    for (const p of c.palabras) {
      const norm = normalizar(p)
      if (norm.length >= MIN_LEN && norm.length <= SIZE && !mapa.has(norm)) {
        mapa.set(norm, { original: p, norm, cancion: c.titulo })
      }
    }
  }
  return [...mapa.values()]
}

// los datos no cambian durante la sesión: se calcula una vez por disco
const cacheJuego = new Map()
export function discoTieneJuego(discoId) {
  if (!cacheJuego.has(discoId)) cacheJuego.set(discoId, palabrasDisponibles(discoId).length >= 5)
  return cacheJuego.get(discoId)
}

function intentarGrilla(candidatas, cantidad) {
  const grilla = Array.from({ length: SIZE }, () => Array(SIZE).fill(''))
  const puestas = []
  for (const palabra of candidatas) {
    if (puestas.length >= cantidad) break
    if (puestas.some((p) => p.norm.includes(palabra.norm) || palabra.norm.includes(p.norm))) continue
    const len = palabra.norm.length
    for (let intento = 0; intento < 80; intento++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)]
      const r0 = Math.floor(Math.random() * SIZE)
      const c0 = Math.floor(Math.random() * SIZE)
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

export function nuevaPartida(discoId) {
  const pool = palabrasDisponibles(discoId)
  const cantidad = Math.min(pool.length, 8 + Math.floor(Math.random() * 3))
  let mejor = null
  for (let i = 0; i < 20; i++) {
    const res = intentarGrilla(mezclar(pool), cantidad)
    if (!mejor || res.puestas.length > mejor.puestas.length) mejor = res
    if (res.puestas.length >= cantidad) break
  }
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let grilla
  // el relleno al azar no debe formar una segunda copia de ninguna palabra
  for (let i = 0; i < 60; i++) {
    grilla = mejor.grilla.map((fila) =>
      fila.map((x) => x || letras[Math.floor(Math.random() * letras.length)]),
    )
    if (mejor.puestas.every((p) => contarApariciones(grilla, p.norm) === 1)) break
  }
  return { grilla, palabras: mejor.puestas }
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
