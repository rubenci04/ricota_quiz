import datos from './data/datos-ricotero.json'
import { hashSemilla } from './azar.js'

export const idTexto = (prefijo, texto) => `${prefijo}:${hashSemilla(texto).toString(36)}`
export const idCancion = (titulo) => `c:${datos.canciones.findIndex((c) => c.titulo === titulo)}`
export const idPregunta = (p) => idTexto('q', p.pistas ? `${p.texto}:${p.opciones[p.correcta]}` : p.texto)
export const idsTrivia = (ronda) => ronda.flatMap((p) => [idPregunta(p), ...(p.cancion ? [idCancion(p.cancion)] : [])])
export const idsSopa = (j) => j.palabras.flatMap((p) => [idTexto('w', p.norm), idCancion(p.cancion)])
export const idsCrucigrama = (j) => j.entradas.flatMap((p) => [idTexto('w', p.respuesta), ...(p.cancion ? [idCancion(p.cancion)] : [])])
export const idsAdivinanza = (r) => [idTexto('r', `${r.categoria}:${r.id}`), ...(r.acertijoId ? [`a:${r.acertijoId}`] : []), ...(r.cancion ? [idCancion(r.cancion.titulo)] : [])]

export function prioridad(ids, plan) {
  if (!plan) return 0
  return Math.max(-1, ...ids.map((id) => (plan.recientes.includes(id) ? 10000 : 0) + plan.vistos.lastIndexOf(id) + 1))
}

export const ordenarNovedad = (lista, idsDe, plan) => plan ? lista.sort((a, b) => prioridad(idsDe(a), plan) - prioridad(idsDe(b), plan)) : lista
