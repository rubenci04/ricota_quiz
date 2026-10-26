import datos from './data/datos-ricotero.json'
import acertijos from './data/adivinanzas.json'
import { normalizarLetras } from './letras.js'
import { crearAzar } from './azar.js'
import { cumpleTema } from './temas.js'
import { idTexto, idCancion, ordenarNovedad } from './identidad.js'

export const cancionesConPalabras = datos.canciones.filter((c) => c.palabras_verificadas && c.palabras.length >= 3)

// La Ñ se muestra como Ñ pero se acepta como N.
export const clave = (l) => (l === 'Ñ' ? 'N' : l)
export const mismaLetra = (a, b) => clave(a) === clave(b)

// Una casilla por letra de la respuesta, agrupadas por palabra; el guion separa grupos y se ve.
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

// ---- modos y categorías
export const MODOS_ADIVINANZA = [
  { id: 'dicho', etiqueta: 'Dicho de otra forma', icono: '🧩', color: 'var(--c-dicho)', detalle: 'Te lo cuento con otras palabras' },
  { id: 'palabras', etiqueta: 'Por palabras', icono: '🔤', color: 'var(--c-palabras)', detalle: 'Palabras clave de la canción' },
]

export const CATEGORIAS = [
  { id: 'canciones', etiqueta: 'Canciones', icono: '🎵', color: '#e11d48', detalle: 'Adiviná el título' },
  { id: 'discos', etiqueta: 'Discos', icono: '💿', color: '#f59e0b', detalle: 'De qué disco hablo' },
  { id: 'palabras', etiqueta: 'Palabras', icono: '📖', color: '#10b981', detalle: 'De la definición a la palabra' },
  { id: 'integrantes', etiqueta: 'Integrantes', icono: '🎤', color: '#0ea5e9', detalle: '¿Quién soy?' },
]

export const DIFICULTADES = [
  { id: 'casual', etiqueta: 'Casual', icono: '🙂' },
  { id: 'fanatico', etiqueta: 'Fanático', icono: '🔥' },
]
export const etiquetaDe = (lista, id) => lista.find((x) => x.id === id)

// Para los links de desafío: un solo texto por ronda ('palabras', 'dichocanciones', ...).
export const rondaToken = (modo, categoria) => (modo === 'palabras' ? 'palabras' : `dicho${categoria}`)
export function leerToken(token) {
  if (token === 'palabras') return { modo: 'palabras', categoria: 'canciones' }
  if (token === 'parafraseado') return { modo: 'dicho', categoria: 'canciones' } // links anteriores
  const categoria = token.startsWith('dicho') ? token.slice(5) : ''
  return CATEGORIAS.some((c) => c.id === categoria) ? { modo: 'dicho', categoria } : null
}
export const TOKENS = ['palabras', 'parafraseado', ...CATEGORIAS.map((c) => `dicho${c.id}`)]

// ---- acertijos con textos propios (src/data/adivinanzas.json)
const ORDEN_NIVEL = { facil: 0, medio: 1, dificil: 2 }
const NIVELES_POR_DIFICULTAD = { casual: ['facil', 'medio'], fanatico: ['medio', 'dificil'] }
const deRespuesta = (tipo, respuesta, curado = true) =>
  acertijos.filter((a) => (!curado || !a.descartada) && a.tipo === tipo && a.respuesta === respuesta).sort((a, b) => ORDEN_NIVEL[a.nivel] - ORDEN_NIVEL[b.nivel])

// Devuelve el acertijo de una canción adecuado a la dificultad, para usarlo también en el reto del día.
export function acertijoDeCancion(titulo, dif, azar) {
  const todos = deRespuesta('cancion', titulo)
  const permitidos = todos.filter((a) => NIVELES_POR_DIFICULTAD[dif].includes(a.nivel))
  return azar.elegir(permitidos.length ? permitidos : todos)?.texto
}

const discoDe = (id) => datos.discos.find((d) => d.id === id)

// Canciones del disco y tema elegidos; si son pocas, se completa con otras (primero del mismo tema).
function cancionesParaRonda(disco, tema) {
  const base = cancionesConPalabras
  const propias = base.filter((c) => (disco === 'todos' || c.disco === disco) && cumpleTema(c, tema))
  if (propias.length >= 3) return { lista: propias, completada: false }
  const resto = base.filter((c) => !propias.includes(c))
  const mismoTema = resto.filter((c) => cumpleTema(c, tema))
  return { lista: [...propias, ...mismoTema, ...resto.filter((c) => !mismoTema.includes(c))].slice(0, Math.max(6, propias.length)), completada: true }
}

function elegirDistinta(azar, lista, claveDe, anterior, plan, categoria, cancionDe = () => null) {
  if (plan) {
    const ids = (x) => [idTexto('r', `${categoria}:${claveDe(x)}`), ...(cancionDe(x) ? [idCancion(cancionDe(x))] : [])]
    const ciclo = plan.ciclo ?? []
    const sinVer = lista.filter((x) => !ciclo.includes(ids(x)[0]))
    return ordenarNovedad(azar.mezclar(sinVer.length ? sinVer : lista), ids, plan)[0]
  }
  let x
  let intentos = 0
  do {
    x = azar.elegir(lista)
    intentos++
  } while (anterior && claveDe(x) === anterior && lista.length > 1 && intentos < 20)
  return x
}

// Con la misma semilla, modo, categoría, dificultad, disco y tema da siempre la misma ronda.
export function nuevaRonda({ modo, categoria = 'canciones', dif = 'casual', anterior = null, semilla, disco = 'todos', tema = 'todos', plan, curado = true }) {
  const azar = crearAzar(semilla)
  const casual = dif === 'casual'
  let respuesta = ''
  let principal = null
  let palabras = null
  const gratis = []
  const extras = []
  let completada = false
  let id = ''
  let cancion = null
  let acertijoId = null

  if (modo === 'palabras' || categoria === 'canciones') {
    const { lista, completada: c } = cancionesParaRonda(disco, tema)
    completada = c
    cancion = elegirDistinta(azar, lista, (x) => x.titulo, anterior, plan, categoria, (x) => x.titulo)
    respuesta = cancion.titulo
    id = respuesta
    const d = discoDe(cancion.disco)
    if (casual) gratis.push(`Disco: ${d.titulo} (${d.anio})`)
    if (modo === 'palabras') {
      palabras = azar.mezclar(cancion.palabras)
    } else {
      const todos = deRespuesta('cancion', respuesta, curado)
      const permitidos = todos.filter((a) => NIVELES_POR_DIFICULTAD[dif].includes(a.nivel))
      const primero = azar.elegir(permitidos.length ? permitidos : todos)
      acertijoId = primero?.id
      principal = primero?.texto ?? cancion.titulo_parafraseado
      for (const a of todos) if (a !== primero) extras.push(a.texto)
      if (!casual) extras.push(`Disco: ${d.titulo} (${d.anio})`)
    }
  } else if (categoria === 'discos') {
    const lista = disco === 'todos' ? datos.discos : datos.discos.filter((x) => x.id === disco)
    const d = elegirDistinta(azar, lista, (x) => x.titulo, anterior, plan, categoria)
    respuesta = d.titulo
    id = respuesta
    const todos = deRespuesta('disco', respuesta, curado)
    const primero = casual ? todos[0] : todos[todos.length - 1]
    acertijoId = primero?.id
    principal = primero?.texto ?? `Disco de ${d.anio}`
    for (const a of todos) if (a !== primero) extras.push(a.texto)
    if (casual) gratis.push(`Salió en ${d.anio}`)
    else extras.push(`Salió en ${d.anio}`)
  } else if (categoria === 'palabras') {
    const { lista, completada: c } = cancionesParaRonda(disco, tema)
    completada = c
    const pares = lista.flatMap((x) => x.palabras.filter((p) => p.length >= 4 && x.definiciones?.[p]).map((p) => ({ x, p })))
    const par = elegirDistinta(azar, pares, (q) => q.p, anterior, plan, categoria, (q) => q.x.titulo)
    respuesta = par.p
    id = respuesta
    cancion = par.x
    principal = par.x.definiciones[par.p]
    if (casual) gratis.push(`De la canción «${par.x.titulo}»`)
    else extras.push(`De la canción «${par.x.titulo}»`)
  } else {
    // integrantes: solo nombres y roles ya cargados en los datos
    const i = elegirDistinta(azar, datos.integrantes, (x) => x.apodo, anterior, plan, categoria)
    respuesta = i.apodo
    id = respuesta
    principal = `¿Quién soy? ${i.rol}.`
    extras.push(`Mi nombre completo empieza con «${i.nombre[0]}».`, `Mi nombre completo es ${i.nombre}.`)
  }

  const grupos = armarCasillas(respuesta)
  return { modo, categoria, dif, semilla, acertijoId, respuesta, id, principal, palabras, gratis, extras, completada, cancion, grupos, solucion: grupos.flatMap((g) => g.letras) }
}

// Siempre hay con qué armar una ronda (si faltan datos, se completa con otros discos).
export const hayRonda = () => true
