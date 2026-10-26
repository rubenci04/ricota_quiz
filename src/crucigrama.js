import datos from './data/datos-ricotero.json'
import { normalizar } from './sopa.js'
import { crearAzar } from './azar.js'
import { cumpleTema } from './temas.js'
import { idTexto, idCancion, ordenarNovedad } from './identidad.js'
import { perfilDePlan } from './dificultad.js'

export const MAX = 13
const MIN_PALABRAS = 5
const alnum = (t) => normalizar(t).replace(/[^A-Z0-9]/g, '')

// azar de la generación en curso (con semilla si se pidió una)
let R = crearAzar()
let planActual
const mezclar = (arr) => R.mezclar(arr)

// Respuestas de una sola palabra con su pista, todo sacado del JSON.
export function candidatas(discoId, dificultad = 'casual', tema = 'todos') {
  const lista = []
  const vistas = new Set()
  const agregar = (respuesta, pista, cancion) => {
    if (respuesta.length < 3 || respuesta.length > MAX || vistas.has(respuesta)) return
    vistas.add(respuesta)
    lista.push({ respuesta, pista, ...(planActual && cancion ? { cancion } : {}) })
  }

  const cancionesTema = datos.canciones.filter(
    (c) => c.palabras_verificadas && (discoId === 'todos' || c.disco === discoId) && cumpleTema(c, tema),
  )

  // las pistas de discos e integrantes no dependen del tema: solo entran sin tema elegido
  for (const d of tema === 'todos' ? datos.discos : []) {
    if (discoId !== 'todos' && d.id !== discoId) continue
    if (!/\s/.test(d.titulo.trim())) agregar(alnum(d.titulo), `Disco de ${d.anio} (${alnum(d.titulo).length})`)
  }

  for (const i of tema === 'todos' ? datos.integrantes : []) {
    const primera = (r) => r.split(' ')[0]
    const unico = datos.integrantes.filter((x) => primera(x.rol) === primera(i.rol)).length === 1
    const rol = i.rol.replace(/\s*\(.*\)/, '')
    if (unico && !/\s/.test(i.apodo)) agregar(alnum(i.apodo), `Integrante con el rol de ${rol} (${alnum(i.apodo).length})`)
  }

  // Solo palabras con definición cargada en el JSON.
  for (const c of cancionesTema) {
    for (const p of c.palabras) {
      const def = c.definiciones?.[p]
      if (!def) continue
      const a = alnum(p)
      agregar(a, dificultad === 'casual' ? `${c.titulo}: ${def} (${a.length})` : `${def} (${a.length})`, c.titulo)
    }
  }
  return lista
}

// los datos no cambian durante la sesión: se calcula una vez por tema
// compatibilidad: ya no hay discos deshabilitados; se completa con otras canciones
export const hayCrucigrama = () => true

function intentar(cands, objetivo) {
  const grilla = new Map() // "r,c" -> { ch, dirs: Set }
  const puestas = []

  const puedeColocar = (a, r, c, dir) => {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0]
    const rf = r + dr * (a.length - 1)
    const cf = c + dc * (a.length - 1)
    if (r < 0 || c < 0 || rf >= MAX || cf >= MAX) return -1
    if (grilla.has(`${r - dr},${c - dc}`) || grilla.has(`${rf + dr},${cf + dc}`)) return -1
    let cruces = 0
    for (let i = 0; i < a.length; i++) {
      const rr = r + dr * i
      const cc = c + dc * i
      const celda = grilla.get(`${rr},${cc}`)
      if (celda) {
        if (celda.ch !== a[i] || celda.dirs.has(dir)) return -1
        cruces++
      } else if (grilla.has(`${rr + dc},${cc + dr}`) || grilla.has(`${rr - dc},${cc - dr}`)) {
        return -1
      }
    }
    return cruces
  }

  const colocar = (cand, r, c, dir) => {
    const [dr, dc] = dir === 'across' ? [0, 1] : [1, 0]
    for (let i = 0; i < cand.respuesta.length; i++) {
      const k = `${r + dr * i},${c + dc * i}`
      const celda = grilla.get(k) || { ch: cand.respuesta[i], dirs: new Set() }
      celda.dirs.add(dir)
      grilla.set(k, celda)
    }
    puestas.push({ ...cand, r, c, dir })
  }

  for (const cand of cands) {
    if (puestas.length >= objetivo) break
    if (planActual && cand.cancion && new Set(cands.map((p) => p.cancion).filter(Boolean)).size >= objetivo && puestas.some((p) => p.cancion === cand.cancion)) continue
    const a = cand.respuesta
    if (puestas.length === 0) {
      colocar(cand, Math.floor(MAX / 2), Math.floor((MAX - a.length) / 2), 'across')
      continue
    }
    let mejor = []
    let maxCruces = 0
    for (const dir of ['across', 'down']) {
      for (let r = 0; r < MAX; r++) {
        for (let c = 0; c < MAX; c++) {
          const cruces = puedeColocar(a, r, c, dir)
          if (cruces < 1) continue
          if (cruces > maxCruces) { maxCruces = cruces; mejor = [] }
          if (cruces === maxCruces) mejor.push([r, c, dir])
        }
      }
    }
    if (mejor.length) {
      const [r, c, dir] = mejor[R.entero(mejor.length)]
      colocar(cand, r, c, dir)
    }
  }
  return puestas
}

const MIN_CANDIDATAS = 14

// Largo preferido de las palabras: Casual, hasta 8 letras; Fanático, hasta 9 al comienzo. Con más nivel, sin tope.
const rangoCruci = ({ dif, nj }) => (dif === 'fanatico' ? (nj < 2 ? [4, 9] : [3, MAX]) : nj < 5 ? [3, 8] : [3, MAX])

function generarCrucigrama(discoId, dificultad, tema, perfil) {
  const propias = candidatas(discoId, dificultad, tema)
  const extras = []
  let completado = false
  if (propias.length < MIN_CANDIDATAS) {
    // pocas palabras en el disco: se completa con otras canciones (primero del mismo tema)
    completado = true
    const vistas = new Set(propias.map((p) => p.respuesta))
    for (const origen of [candidatas('todos', dificultad, tema), candidatas('todos', dificultad, 'todos')]) {
      for (const p of origen) if (!vistas.has(p.respuesta)) { vistas.add(p.respuesta); extras.push(p) }
      if (propias.length + extras.length >= MIN_CANDIDATAS + 8) break
    }
  }
  const todas = [...propias, ...extras]
  const frescas = planActual ? todas.filter((p) => !planActual.recientes.includes(idTexto('w', p.respuesta)) && (!p.cancion || !planActual.recientes.includes(idCancion(p.cancion)))) : todas
  const base = frescas.length >= MIN_CANDIDATAS ? frescas : todas
  const rango = perfil ? rangoCruci(perfil) : null
  const enRango = rango ? base.filter((p) => p.respuesta.length >= rango[0] && p.respuesta.length <= rango[1]) : base
  const pool = enRango.length >= MIN_CANDIDATAS ? enRango : base
  const propiasSet = new Set(propias.map((p) => p.respuesta))
  const objetivo = 8 + R.entero(3)
  let mejor = []
  // varias rondas con otras semillas (órdenes al azar) antes de rendirse
  for (let ronda = 0; ronda < 3 && mejor.length < MIN_PALABRAS; ronda++) {
    for (let i = 0; i < 40; i++) {
      // las palabras largas primero (cada grupo mezclado con Fisher–Yates) dejan más cruces posibles
      // y dentro de cada grupo, las del disco elegido antes que las de relleno
      const grupo = (largas) => pool.filter((p) => (p.respuesta.length >= 7) === largas)
      const orden = (lista) => [...mezclar(lista.filter((p) => propiasSet.has(p.respuesta))), ...mezclar(lista.filter((p) => !propiasSet.has(p.respuesta)))]
      const candidatos = [...orden(grupo(true)), ...orden(grupo(false))]
      const puestas = intentar(ordenarNovedad(candidatos, (p) => [idTexto('w', p.respuesta), ...(p.cancion ? [idCancion(p.cancion)] : [])], planActual), objetivo)
      if (puestas.length > mejor.length) mejor = puestas
      if (mejor.length >= objetivo) break
    }
  }
  if (mejor.length < MIN_PALABRAS) return null

  // recortar al rectángulo ocupado
  let minR = MAX, minC = MAX, maxR = 0, maxC = 0
  for (const p of mejor) {
    const [dr, dc] = p.dir === 'across' ? [0, 1] : [1, 0]
    minR = Math.min(minR, p.r); minC = Math.min(minC, p.c)
    maxR = Math.max(maxR, p.r + dr * (p.respuesta.length - 1))
    maxC = Math.max(maxC, p.c + dc * (p.respuesta.length - 1))
  }
  const entradas = mejor.map((p) => ({ ...p, r: p.r - minR, c: p.c - minC }))
  const filas = maxR - minR + 1
  const cols = maxC - minC + 1

  const solucion = {}
  for (const e of entradas) {
    const [dr, dc] = e.dir === 'across' ? [0, 1] : [1, 0]
    for (let i = 0; i < e.respuesta.length; i++) solucion[`${e.r + dr * i},${e.c + dc * i}`] = e.respuesta[i]
  }

  // numeración por orden de lectura de las celdas de inicio
  const inicios = [...new Set(entradas.map((e) => `${e.r},${e.c}`))].sort((a, b) => {
    const [ar, ac] = a.split(',').map(Number)
    const [br, bc] = b.split(',').map(Number)
    return ar - br || ac - bc
  })
  const numeros = {}
  inicios.forEach((k, i) => { numeros[k] = i + 1 })
  for (const e of entradas) e.num = numeros[`${e.r},${e.c}`]

  return { filas, cols, entradas, solucion, numeros, completado }
}

// Con la misma semilla, tema y dificultad da siempre el mismo crucigrama; sin semilla es al azar.
export function nuevoCrucigrama(discoId, dificultad = 'casual', semilla, tema = 'todos', plan) {
  planActual = plan
  R = crearAzar(semilla)
  try {
    return generarCrucigrama(discoId, dificultad, tema, perfilDePlan(plan, dificultad))
  } finally {
    R = crearAzar()
    planActual = undefined
  }
}

const celdasDe = (e) => {
  const [dr, dc] = e.dir === 'across' ? [0, 1] : [1, 0]
  return Array.from({ length: e.respuesta.length }, (_, i) => `${e.r + dr * i},${e.c + dc * i}`)
}

// Letras ya puestas (y bloqueadas) además de los cruces: en Casual 2 en las palabras de 7 o más letras y 1 en las demás;
// en Fanático 1 en cada palabra. Siempre que se puede, la primera letra de la palabra.
export function celdasIniciales(juego, dificultad, semilla) {
  const azar = crearAzar(`iniciales-${semilla}`)
  const usos = new Map()
  for (const e of juego.entradas) for (const k of celdasDe(e)) usos.set(k, (usos.get(k) ?? 0) + 1)
  const puestas = new Set()
  for (const e of juego.entradas) {
    const celdas = celdasDe(e)
    const libres = celdas.filter((k) => usos.get(k) === 1)
    const quiere = dificultad === 'casual' && e.respuesta.length >= 7 ? 2 : 1
    const propias = (lista) => lista.filter((k) => puestas.has(k)).length
    if (propias(libres) < quiere && libres.length && !puestas.has(libres[0])) puestas.add(libres[0])
    while (propias(libres) < Math.min(quiere, libres.length)) puestas.add(azar.elegir(libres.filter((k) => !puestas.has(k))))
  }
  return Object.fromEntries([...puestas].map((k) => [k, juego.solucion[k]]))
}
