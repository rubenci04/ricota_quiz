import { crearAzar, hashSemilla } from './azar.js'

// No contiene contenido: el catálogo aprobado se inyecta desde la interfaz.
export const normalizarFrase = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z]/g, '')
const idDe = (s) => `f:${hashSemilla(s).toString(36)}`
export const idsFrases = (ronda) => ronda.flatMap(p => [p.id, idDe(p.cancion)])

// faltantes son índices de palabra (base cero); también acepta palabras inequívocas.
export function validarFrases(lista, { demo = false } = {}) {
  const vistas = new Set()
  return lista.flatMap(f => {
    if (!f || typeof f.cancion !== 'string' || !f.cancion.trim() || typeof f.fragmento !== 'string') return []
    if (f.ejemplo ? !demo : f.aprobada !== true) return []
    const palabras = f.fragmento.trim().split(/\s+/)
    if (palabras.length < 4 || palabras.length > 8 || !Array.isArray(f.faltantes)) return []
    const faltantes = [...new Set(f.faltantes.map(x => Number.isInteger(x) ? x : palabras.findIndex(w => normalizarFrase(w) === normalizarFrase(String(x)) && palabras.filter(p => normalizarFrase(p) === normalizarFrase(String(x))).length === 1)))]
    if (!faltantes.length || faltantes.length > 2 || faltantes.some(i => i < 0 || i >= palabras.length || !normalizarFrase(palabras[i]))) return []
    const id = idDe(palabras.join(' '))
    if (vistas.has(id)) return []
    vistas.add(id)
    return [{ ...f, id, palabras, faltantes, album: f.album || 'Sin datos de álbum' }]
  })
}

export function armarRondaFrases(lista, semilla, dif = 'casual', plan, { demo = false } = {}) {
  const azar = crearAzar(semilla)
  const banco = validarFrases(lista, { demo })
  const prioridad = f => Math.max(-1, ...[f.id,idDe(f.cancion)].map(id => (plan?.recientes?.includes(id) ? 10000 : 0) + (plan?.vistos?.lastIndexOf(id) ?? -1) + 1))
  const orden = azar.mezclar(banco).sort((a,b) => prioridad(a)-prioridad(b))
  const canciones = new Set(), ronda = []
  for (const f of orden) {
    const cancion = f.cancion.trim().toLocaleLowerCase('es')
    if (canciones.has(cancion)) continue
    const faltantes = dif === 'casual' ? [azar.elegir(f.faltantes)] : azar.mezclar(f.faltantes).slice(0, 1 + azar.entero(2)).sort((a,b)=>a-b)
    const respuesta = faltantes.map(i=>f.palabras[i]).join(' ')
    let opciones = []
    if (dif === 'casual') {
      const correcta = normalizarFrase(respuesta), candidatas = new Map()
      for (const otra of azar.mezclar(banco)) {
        if (otra.cancion.trim().toLocaleLowerCase('es') === cancion) continue
        for (const palabra of otra.palabras) {
          const norm = normalizarFrase(palabra)
          if (norm !== correcta && norm.length >= 3 && Math.abs(norm.length-correcta.length) <= 2) candidatas.set(norm, palabra.replace(/[^\p{L}]/gu,''))
        }
      }
      if (candidatas.size < 3) continue
      opciones = azar.mezclar([respuesta, ...azar.mezclar([...candidatas.values()]).slice(0,3)])
    }
    canciones.add(cancion)
    ronda.push({ ...f, faltantes, respuesta, opciones })
    if (ronda.length === 10) break
  }
  // Una ronda real nunca se completa reciclando fragmentos ni canciones.
  return ronda.length === 10 || (demo && ronda.length > 0) ? ronda : []
}

export const semillaFrasesDia = fecha => `fd${fecha.replaceAll('-', '')}`
export const frasesDelDia = (lista, fecha, dif = 'casual') => armarRondaFrases(lista, semillaFrasesDia(fecha), dif)
