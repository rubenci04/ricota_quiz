// Reto del día: una canción por día, igual para todos, según la fecha de Buenos Aires.
import datos from './data/datos-ricotero.json'
import { crearAzar } from './azar.js'
import { guardar, leer } from './storage.js'

export const ZONA = 'America/Argentina/Buenos_Aires'
export const INTENTOS_MAX = 6
const INICIO = '2026-01-01' // día 1 de la rotación

// Catálogo estable: canciones con palabras verificadas y título parafraseado, ordenadas por título.
export const catalogo = datos.canciones
  .filter((c) => c.palabras_verificadas && c.titulo_parafraseado)
  .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))

// AAAA-MM-DD en Buenos Aires
export function fechaBA(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(ahora)
}

const numeroDeDia = (fecha) => {
  const [y, m, d] = fecha.split('-').map(Number)
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

export const ayerDe = (fecha) => new Date((numeroDeDia(fecha) - 1) * 86400000).toISOString().slice(0, 10)

// Buenos Aires está en UTC-3 todo el año: la medianoche local es a las 03:00 UTC.
export function msHastaProximo(ahora = new Date()) {
  const [y, m, d] = fechaBA(ahora).split('-').map(Number)
  return Date.UTC(y, m - 1, d + 1, 3, 0, 0) - ahora.getTime()
}

// Orden de un ciclo completo del catálogo: ninguna canción se repite hasta recorrerlas todas.
function ordenDelCiclo(ciclo) {
  const indices = crearAzar(`ricota-ciclo-${ciclo}`).mezclar(catalogo.map((_, i) => i))
  if (ciclo > 0) {
    const anterior = ordenDelCiclo(ciclo - 1)
    // evita repetir la última del ciclo anterior justo al empezar el siguiente
    if (indices[0] === anterior[anterior.length - 1]) [indices[0], indices[1]] = [indices[1], indices[0]]
  }
  return indices
}

export function retoDe(fecha) {
  const n = Math.max(0, numeroDeDia(fecha) - numeroDeDia(INICIO))
  const total = catalogo.length
  const cancion = catalogo[ordenDelCiclo(Math.floor(n / total))[n % total]]
  const azar = crearAzar(`reto-${fecha}`) // la fecha es la semilla del reto
  return { fecha, numero: n + 1, cancion, palabras: azar.mezclar(cancion.palabras) }
}

// Cuadro por intento según el porcentaje de letras acertadas. No revela la respuesta.
export const cuadro = (fraccion) => (fraccion >= 1 ? '🟩' : fraccion >= 0.5 ? '🟨' : '🟥')

export function textoCompartir(reto, resultados, gano) {
  const marcador = gano ? `${resultados.length}/${INTENTOS_MAX}` : `X/${INTENTOS_MAX}`
  return `Reto del día #${reto.numero} ricotero ${marcador}\n${resultados.map(cuadro).join('')}\n¿Podés superarme? 🎸`
}

// Racha vigente: sigue viva solo si el último reto fue hoy o ayer.
export function rachaVigente(estado, hoy = fechaBA()) {
  return estado.ultimoDia === hoy || estado.ultimoDia === ayerDe(hoy) ? estado.rachaDias : 0
}

// Se cortó una racha mientras no se jugaba (para avisarlo con cariño).
export function rachaCortada(estado, hoy = fechaBA()) {
  return estado.rachaDias > 0 && rachaVigente(estado, hoy) === 0
}

// Guarda el avance del reto de hoy; al terminar, actualiza la racha.
export function guardarReto(fecha, resultados, terminado, gano) {
  const cambios = { retoHoy: { fecha, resultados, terminado, gano } }
  if (terminado) {
    const e = leer()
    if (e.ultimoDia !== fecha) {
      const rachaDias = e.ultimoDia === ayerDe(fecha) ? e.rachaDias + 1 : 1
      cambios.rachaDias = rachaDias
      cambios.rachaMax = Math.max(e.rachaMax, rachaDias)
      cambios.ultimoDia = fecha
      cambios.partidas = e.partidas + 1
      if (gano) cambios.retosGanados = e.retosGanados + 1
    }
  }
  return guardar(cambios)
}

export function retoGuardadoDeHoy(fecha = fechaBA()) {
  const r = leer().retoHoy
  return r && r.fecha === fecha ? r : null
}
