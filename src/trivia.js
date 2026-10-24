import datos from './data/datos-ricotero.json'
import { normalizar } from './sopa.js'

export const PREGUNTAS_POR_NIVEL = 10
const { discos, canciones, integrantes } = datos

const azar = (arr) => arr[Math.floor(Math.random() * arr.length)]

function mezclar(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Arma 4 opciones: la correcta + 3 distractores únicos del pool.
function armar(texto, correcta, pool, extra = {}) {
  const distractores = mezclar([...new Set(pool)].filter((x) => x !== correcta)).slice(0, 3)
  if (distractores.length < 3) return null
  const opciones = mezclar([correcta, ...distractores])
  return { texto, opciones, correcta: opciones.indexOf(correcta), ...extra }
}

const tituloDisco = (id) => discos.find((d) => d.id === id).titulo

function preguntaAnio() {
  const d = azar(discos)
  const anios = discos.map((x) => String(x.anio))
  const tema = canciones.find((c) => c.disco === d.id)
  const ayuda = tema ? `Incluye la canción «${tema.titulo}»` : `Es de los años ${Math.floor(d.anio / 10) * 10}`
  return armar(`¿En qué año salió el disco "${d.titulo}"?`, String(d.anio), anios, { ayuda })
}

function preguntaDisco() {
  const c = azar(canciones)
  const anio = discos.find((d) => d.id === c.disco).anio
  return armar(`¿A qué disco pertenece la canción "${c.titulo}"?`, tituloDisco(c.disco), discos.map((d) => d.titulo), {
    ayuda: `El disco salió en ${anio}`,
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
  const cuantas = Math.min(c.palabras.length, 4 + Math.floor(Math.random() * 2))
  const mostradas = mezclar(c.palabras).slice(0, cuantas)
  const norm = mostradas.map(normalizar)
  // un distractor que contenga todas las palabras mostradas sería ambiguo
  const pool = canciones
    .filter((x) => x.titulo === c.titulo || !norm.every((n) => x.palabras.map(normalizar).includes(n)))
    .map((x) => x.titulo)
  const anio = discos.find((d) => d.id === c.disco).anio
  return armar('Adiviná la canción', c.titulo, pool, { pistas: mostradas, ayuda: `La canción salió en ${anio}` })
}

const palabrasTitulo = (t) => t.split(' ').filter((w) => normalizar(w).length >= 4)

function preguntaTitulo() {
  const c = azar(canciones.filter((x) => palabrasTitulo(x.titulo).length > 0))
  const oculta = azar(palabrasTitulo(c.titulo))
  const enTitulo = c.titulo.split(' ').map(normalizar)
  const pool = canciones
    .flatMap((x) => palabrasTitulo(x.titulo))
    .filter((w) => !enTitulo.includes(normalizar(w)))
  const titulo = c.titulo.replace(oculta, '_____')
  return armar(`Completá el título: "${titulo}"`, oculta, pool, {
    ayuda: `Es de «${tituloDisco(c.disco)}» y la palabra tiene ${oculta.length} letras`,
  })
}

const GENERADORES = {
  a: preguntaAnio,
  b: preguntaDisco,
  c: preguntaRol,
  d: preguntaPalabras,
  e: preguntaTitulo,
}

// Cuanto más alto el nivel, más preguntas de tipo d y e.
export function armarNivel(nivel) {
  const dye = Math.min(PREGUNTAS_POR_NIVEL, 2 * nivel)
  const tipos = mezclar([
    ...Array.from({ length: dye }, (_, i) => (i % 2 ? 'e' : 'd')),
    ...Array.from({ length: PREGUNTAS_POR_NIVEL - dye }, () => azar(['a', 'b', 'c'])),
  ])
  const vistas = new Set()
  return tipos.map((t) => {
    for (let i = 0; i < 30; i++) {
      const p = GENERADORES[t]()
      if (!p) continue
      const k = p.texto + (p.pistas || []).join()
      if (vistas.has(k)) continue
      vistas.add(k)
      return p
    }
    return GENERADORES.a()
  })
}

export function curiosidadAlAzar() {
  const lista = datos.curiosidades
  if (!Array.isArray(lista) || lista.length === 0) return null
  const c = azar(lista)
  if (typeof c === 'string') return c
  return c?.texto || c?.curiosidad || null
}
