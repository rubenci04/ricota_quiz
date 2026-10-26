import datos from './data/datos-ricotero.json'
import { normalizar } from './sopa.js'
import { crearAzar } from './azar.js'
import { cumpleTema } from './temas.js'
import hechosBanda from './data/banda.json'
import { idPregunta, idCancion, prioridad } from './identidad.js'
import { filtrarPorTitulo, nivelTitulo, ordenarDistintivas, perfilDePlan, techoTitulo } from './dificultad.js'

export const PREGUNTAS_POR_NIVEL = 10
const MAX_PREGUNTAS_ANIO = 2
const { discos, integrantes } = datos
// canciones de la partida en curso (se acotan cuando se elige un tema)
let canciones = datos.canciones
// solo se usan preguntas de la banda con fuente confirmada
const hechos = hechosBanda.filter((h) => h.verificada === true)

// azar de la generación en curso (con semilla si se pidió una)
let R = crearAzar()
let versionGenerador = 1
let planActual
// perfil de dificultad por largo de título (solo en partidas con plan: las anteriores no cambian)
let perfil = null
const nivelDe = new Map(datos.canciones.map((c) => [c.titulo, nivelTitulo(c.titulo)]))
const conPalabras = datos.canciones.filter((c) => c.palabras_verificadas)
const azar = (arr) => R.elegir(arr)

const mezclar = (arr) => R.mezclar(arr)

// Arma 4 opciones: la correcta + 3 distractores únicos del pool.
function armar(texto, correcta, pool, extra = {}) {
  // con perfil, ningún distractor es un título de nivel 4 ni más largo de lo permitido
  const tope = perfil ? Math.min(techoTitulo(perfil.dif, perfil.nj), 3) : 4
  const distractores = mezclar([...new Set(pool)].filter((x) => x !== correcta && (nivelDe.get(x) ?? 0) <= tope)).slice(0, 3)
  if (distractores.length < 3) return null
  const opciones = mezclar([correcta, ...distractores])
  const p = { texto, opciones, correcta: opciones.indexOf(correcta), ...extra }
  if (versionGenerador < 3) delete p.cancion
  return p
}

const tituloDisco = (id) => discos.find((d) => d.id === id).titulo
const anioDe = (id) => discos.find((d) => d.id === id).anio
const porAnio = [...discos].sort((a, b) => a.anio - b.anio)
const cancionesDe = (id) => canciones.filter((c) => c.disco === id).map((c) => c.titulo)

// ---------- preguntas generales (todas salen de datos del JSON)
function preguntaAnio() {
  const d = azar(discos)
  const anios = discos.map((x) => String(x.anio))
  const tema = canciones.find((c) => c.disco === d.id)
  const ayuda = tema ? `Incluye la canción «${tema.titulo}»` : `Es de los años ${Math.floor(d.anio / 10) * 10}`
  const p = armar(`¿En qué año salió el disco "${d.titulo}"?`, String(d.anio), anios, { ayuda })
  return p && { ...p, tipo: 'anio' }
}

function preguntaDisco() {
  const c = azar(canciones)
  return armar(`¿A qué disco pertenece la canción "${c.titulo}"?`, tituloDisco(c.disco), discos.map((d) => d.titulo), {
    cancion: c.titulo,
    ayuda: `El disco salió en ${anioDe(c.disco)}`,
  })
}

function preguntaRol() {
  const i = azar(integrantes)
  const raiz = (r) => r.split(' ')[0]
  const pool = integrantes.filter((x) => raiz(x.rol) !== raiz(i.rol)).map((x) => x.rol)
  return armar(`¿Qué rol tenía ${i.apodo} en la banda?`, i.rol, pool, { ayuda: `La respuesta empieza con «${i.rol[0]}»` })
}

function preguntaPalabras() {
  const c = azar(canciones.filter((x) => x.palabras_verificadas && x.palabras.length >= 4))
  if (!c) return null
  const nuevo = versionGenerador >= 3
  const cuantas = Math.min(c.palabras.length, (nuevo ? 5 : 4) + R.entero(2))
  // las más distintivas primero: las que aparecen en menos canciones y no están en el título
  const mostradas = nuevo ? ordenarDistintivas(c, conPalabras, R).slice(0, cuantas) : mezclar(c.palabras).slice(0, cuantas)
  const norm = mostradas.map(normalizar)
  // un distractor que contenga todas las palabras mostradas sería ambiguo
  const pool = canciones
    .filter((x) => x.titulo === c.titulo || !norm.every((n) => x.palabras.map(normalizar).includes(n)))
    .map((x) => x.titulo)
  return armar('Adiviná la canción', c.titulo, pool, { cancion: c.titulo, pistas: mostradas, ayuda: `La canción salió en ${anioDe(c.disco)}` })
}

// "Completá el título": sin signos, sin títulos de una palabra ni con guion
const limpiar = (w) => w.replace(/[^\p{L}\p{N}]/gu, '')
const ocultables = (t) => t.split(' ').filter((w) => !w.includes('-') && limpiar(w).length >= 4)
const titulosCompletables = () => canciones.filter((c) => c.titulo.split(' ').length >= 2 && ocultables(c.titulo).length > 0)

function preguntaTitulo() {
  const posibles = titulosCompletables()
  if (!posibles.length) return null
  const c = azar(posibles)
  const token = azar(ocultables(c.titulo))
  const oculta = limpiar(token).toLowerCase()
  const enTitulo = c.titulo.split(' ').map((w) => normalizar(limpiar(w)))
  const vistas = new Set()
  const pool = []
  for (const x of canciones) {
    if (x.titulo.split(' ').length < 2) continue
    for (const w of ocultables(x.titulo)) {
      const l = limpiar(w).toLowerCase()
      const k = normalizar(l)
      if (enTitulo.includes(k) || vistas.has(k)) continue
      vistas.add(k)
      pool.push(l)
    }
  }
  const mostrado = c.titulo
    .split(' ')
    .map((w) => (w === token ? w.replace(/[\p{L}\p{N}]+/u, '_____') : w))
    .join(' ')
  return armar(`Completá el título: "${mostrado}"`, oculta, pool, {
    cancion: c.titulo,
    ayuda: `Es de «${tituloDisco(c.disco)}» y la palabra tiene ${oculta.length} letras`,
  })
}

// ---------- variantes sobre discos, canciones e integrantes
function opcionesDe(lista, correctaFn) {
  const opciones = mezclar(lista)
  return { opciones: opciones.map((d) => d.titulo), correcta: opciones.findIndex(correctaFn) }
}

function preguntaPrimero() {
  const cuatro = mezclar(discos).slice(0, 4)
  const gana = cuatro.reduce((a, b) => (b.anio < a.anio ? b : a))
  return { texto: '¿Cuál de estos discos salió primero?', ...opcionesDe(cuatro, (d) => d === gana), ayuda: 'El más antiguo es de los años ' + Math.floor(gana.anio / 10) * 10, dato: `«${gana.titulo}» salió en ${gana.anio}.` }
}

function preguntaUltimo() {
  const cuatro = mezclar(discos).slice(0, 4)
  const gana = cuatro.reduce((a, b) => (b.anio > a.anio ? b : a))
  return { texto: '¿Cuál de estos discos salió último?', ...opcionesDe(cuatro, (d) => d === gana), ayuda: 'El más nuevo es de ' + gana.anio, dato: `«${gana.titulo}» salió en ${gana.anio}.` }
}

function preguntaNoPertenece() {
  const grandes = discos.filter((x) => cancionesDe(x.id).length >= 3)
  if (!grandes.length) return null
  const d = azar(grandes)
  const ajenas = canciones.filter((c) => c.disco !== d.id)
  const extra = azar(ajenas)
  return armar(`¿Qué canción NO pertenece al disco «${d.titulo}»?`, extra.titulo, [extra.titulo, ...cancionesDe(d.id)], {
    cancion: extra.titulo,
    ayuda: `La intrusa es de un disco de ${anioDe(extra.disco)}`,
    dato: `«${extra.titulo}» es de «${tituloDisco(extra.disco)}».`,
  })
}

function preguntaEntre() {
  const i = 1 + R.entero(porAnio.length - 2)
  const [antes, medio, despues] = [porAnio[i - 1], porAnio[i], porAnio[i + 1]]
  return armar(
    `¿Qué disco salió entre «${antes.titulo}» y «${despues.titulo}»?`,
    medio.titulo,
    porAnio.filter((d) => d !== antes && d !== despues).map((d) => d.titulo),
    { ayuda: `Salió en ${medio.anio}`, dato: `«${medio.titulo}» salió en ${medio.anio}.` },
  )
}

function preguntaDecada() {
  const d = azar(discos)
  const decada = Math.floor(d.anio / 10) * 10
  const etiqueta = decada >= 2000 ? '2000' : String(decada % 100)
  const otros = discos.filter((x) => Math.floor(x.anio / 10) * 10 !== decada).map((x) => x.titulo)
  return armar(`¿Cuál de estos discos salió en los años ${etiqueta}?`, d.titulo, [d.titulo, ...otros], {
    ayuda: `Es de ${d.anio}`,
    dato: `«${d.titulo}» salió en ${d.anio}.`,
  })
}

function preguntaCancionDeDisco() {
  const conCanciones = discos.filter((x) => cancionesDe(x.id).length >= 1)
  if (!conCanciones.length) return null
  const d = azar(conCanciones)
  const propia = azar(cancionesDe(d.id))
  const ajenas = canciones.filter((c) => c.disco !== d.id).map((c) => c.titulo)
  return armar(`¿Cuál de estas canciones pertenece a «${d.titulo}»?`, propia, [propia, ...ajenas], {
    cancion: propia,
    ayuda: `El disco salió en ${d.anio}`,
  })
}

function preguntaQuien() {
  const raiz = (r) => r.split(' ')[0]
  const unicos = integrantes.filter((i) => integrantes.filter((x) => raiz(x.rol) === raiz(i.rol)).length === 1)
  const i = azar(unicos)
  const rol = i.rol.replace(/\s*\(.*\)/, '').toLowerCase()
  return armar(`¿Qué integrante tenía el rol de «${rol}»?`, i.apodo, integrantes.map((x) => x.apodo), {
    ayuda: `La respuesta empieza con «${i.apodo[0]}»`,
    dato: `${i.apodo}: ${i.rol}.`,
  })
}

const GENERADORES = {
  a: preguntaAnio,
  b: preguntaDisco,
  c: preguntaRol,
  d: preguntaPalabras,
  e: preguntaTitulo,
  f: preguntaPrimero,
  g: preguntaUltimo,
  h: preguntaNoPertenece,
  i: preguntaEntre,
  j: preguntaDecada,
  k: preguntaCancionDeDisco,
  l: preguntaQuien,
}

// Evita repetidas dentro de la partida y limita las de tipo "año".
function crearContexto() {
  return { vistas: new Set(), canciones: new Set(), anios: 0, largos: 0 }
}

function intentar(gen, ctx) {
  if (planActual) {
    let mejor = null, valor = Infinity
    for (let i = 0; i < 80; i++) {
      const p = gen()
      if (!p || ctx.vistas.has(clavePregunta(p)) || (p.tipo === 'anio' && ctx.anios >= MAX_PREGUNTAS_ANIO)) continue
      if (perfil && nivelDe.get(p.cancion) === 4 && ctx.largos >= 1) continue // un título de nivel 4 como máximo por partida
      if (p.cancion && canciones.length >= 10 && ctx.canciones.has(p.cancion)) continue
      if (planActual.recientes.includes(idPregunta(p))) continue
      const ids = [idPregunta(p), ...(p.cancion ? [idCancion(p.cancion)] : [])]
      const puntaje = prioridad(ids, planActual)
      if (puntaje < valor) { mejor = p; valor = puntaje }
      if (valor === 0) break
    }
    if (!mejor) return null
    ctx.vistas.add(clavePregunta(mejor))
    if (mejor.cancion) ctx.canciones.add(mejor.cancion)
    if (nivelDe.get(mejor.cancion) === 4) ctx.largos++
    if (mejor.tipo === 'anio') ctx.anios++
    return mejor
  }
  for (let i = 0; i < 30; i++) {
    const p = gen()
    if (!p) continue
    if (p.tipo === 'anio' && ctx.anios >= MAX_PREGUNTAS_ANIO) return null
    const k = versionGenerador === 1 ? p.texto + (p.pistas || []).join() : clavePregunta(p)
    if (ctx.vistas.has(k)) continue
    ctx.vistas.add(k)
    if (p.tipo === 'anio') ctx.anios += 1
    return p
  }
  return null
}

// Prueba el generador preferido y, si no sirve, otros; respeta siempre las repetidas.
function pedir(preferido, alternativas, ctx) {
  for (const gen of [preferido, ...mezclar(alternativas)]) {
    const p = intentar(gen, ctx)
    if (p) return p
  }
  if (versionGenerador === 1) return intentar(preguntaPrimero, ctx) || preguntaPrimero()
  // Banco amplio y existente como respaldo, sin saltar nunca la deduplicación.
  for (const gen of [preguntaTitulo, preguntaPalabras, ...alternativas]) {
    const p = intentar(gen, ctx)
    if (p) return p
  }
  throw new Error('El banco no alcanza para diez preguntas distintas.')
}

const BASICOS = [preguntaAnio, preguntaDisco, preguntaRol, preguntaPrimero, preguntaUltimo, preguntaNoPertenece, preguntaEntre, preguntaDecada, preguntaCancionDeDisco, preguntaQuien]

// Con un tema elegido solo se usan preguntas que salen de las canciones de ese tema.
const BASICOS_CANCION = [preguntaDisco, preguntaNoPertenece, preguntaCancionDeDisco]

// Cuanto más alto el nivel, más preguntas de tipo d y e.
function generarNivel(nivel, basicos = BASICOS) {
  const ctx = crearContexto()
  const dye = Math.min(PREGUNTAS_POR_NIVEL, 2 * nivel)
  const tipos = mezclar([
    ...Array.from({ length: dye }, (_, i) => (i % 2 ? preguntaTitulo : preguntaPalabras)),
    ...Array.from({ length: PREGUNTAS_POR_NIVEL - dye }, () => azar(basicos)),
  ])
  return tipos.map((gen) => pedir(gen, basicos, ctx))
}

// ---------- La banda: preguntas de nicho (datos curados con fuente + generadas del JSON)
const unir = (autores) => autores.join(' y ')

function preguntaAutor() {
  const c = azar(canciones.filter((x) => x.autores?.length))
  const correcta = unir(c.autores)
  const distractoras = [
    unir(['Eduardo "Skay" Beilinson', 'Walter Sidotti']),
    unir(['Carlos "Indio" Solari', 'Sergio Dawi']),
    unir(['Daniel "Semilla" Bucciarelli', 'Walter Sidotti']),
    unir(['Carlos "Indio" Solari', 'Eduardo "Skay" Beilinson']),
    unir(['Carlos "Indio" Solari', 'Eduardo "Skay" Beilinson', 'Daniel "Semilla" Bucciarelli']),
  ]
  return armar(`¿Quiénes figuran como autores de «${c.titulo}»?`, correcta, distractoras, {
    cancion: c.titulo,
    ayuda: `Figura en el disco «${tituloDisco(c.disco)}»`,
    dato: `Autoría según Wikipedia: ${correcta}.`,
  })
}

function preguntaPrimerDisco() {
  const primero = porAnio[0]
  return armar('¿Cuál fue el primer disco de estudio de la banda?', primero.titulo, discos.map((d) => d.titulo), {
    ayuda: `Salió en ${primero.anio}`,
  })
}

function preguntaCurada() {
  const h = azar(hechos)
  const opciones = mezclar([h.correcta, ...h.incorrectas])
  return {
    texto: h.pregunta,
    opciones,
    correcta: opciones.indexOf(h.correcta),
    ayuda: `La respuesta empieza con «${h.correcta[0]}»`,
    dato: h.dato,
  }
}

const GENERADAS_BANDA = [preguntaAutor, preguntaRol, preguntaAnio, preguntaPrimerDisco, preguntaPrimero, preguntaUltimo, preguntaNoPertenece, preguntaEntre, preguntaDecada, preguntaQuien]

function generarNivelBanda(nivel) {
  const ctx = crearContexto()
  const curadas = Math.min(PREGUNTAS_POR_NIVEL - 2, 4 + nivel)
  const tipos = mezclar([
    ...Array.from({ length: curadas }, () => preguntaCurada),
    ...Array.from({ length: PREGUNTAS_POR_NIVEL - curadas }, () => azar(GENERADAS_BANDA)),
  ])
  return tipos.map((gen) => pedir(gen, GENERADAS_BANDA, ctx))
}

export function curiosidadAlAzar() {
  const lista = datos.curiosidades
  if (!Array.isArray(lista) || lista.length === 0) return null
  const c = azar(lista)
  if (typeof c === 'string') return c
  return c?.texto || c?.curiosidad || null
}

// Con la misma semilla y nivel dan siempre las mismas preguntas; sin semilla son al azar.
export function clavePregunta(p) {
  // Las pistas reordenadas de la misma canción cuentan como la misma pregunta.
  return p.pistas ? `${p.texto}:${p.opciones[p.correcta]}` : p.texto
}

export function armarNivel(nivel, semilla, tema = 'todos', version = 1, plan, dif = 'casual') {
  versionGenerador = version
  planActual = plan
  R = crearAzar(semilla)
  perfil = perfilDePlan(plan, dif)
  canciones = filtrarPorTitulo(datos.canciones.filter((c) => cumpleTema(c, tema)), (c) => c.titulo, perfil, R, 8)
  try {
    return generarNivel(nivel, tema === 'todos' ? BASICOS : BASICOS_CANCION)
  } finally {
    R = crearAzar()
    canciones = datos.canciones
    versionGenerador = 1
    planActual = undefined
    perfil = null
  }
}

// ¿Hay canciones suficientes con ese tema para armar un nivel?
export const triviaTieneTema = (tema) => datos.canciones.filter((c) => cumpleTema(c, tema)).length >= 6

export function armarNivelBanda(nivel, semilla, version = 1, plan, dif = 'casual') {
  versionGenerador = version
  planActual = plan
  R = crearAzar(semilla)
  perfil = perfilDePlan(plan, dif)
  canciones = filtrarPorTitulo(datos.canciones, (c) => c.titulo, perfil, R, 8)
  try {
    return generarNivelBanda(nivel)
  } finally {
    R = crearAzar()
    canciones = datos.canciones
    versionGenerador = 1
    planActual = undefined
    perfil = null
  }
}
