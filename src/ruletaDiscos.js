// Porciones de ruleta por disco (con el año) y búsqueda del disco de una canción.
import datos from './data/datos-ricotero.json'

const COLORES = ['#e11d48', '#f59e0b', '#10b981', '#0ea5e9', '#7c3aed', '#ec4899', '#14b8a6', '#f97316', '#84cc16']
const limpiar = (t) => String(t).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const porTitulo = new Map(datos.canciones.map((c) => [limpiar(c.titulo), c.disco]))

// id del disco de una canción, o null si no figura en los datos
export const discoDeCancion = (titulo) => porTitulo.get(limpiar(titulo)) ?? null

// Porción de la ruleta para un disco: el año como ícono y el título en el cartel de resultado.
export const porcionDeDisco = (id) => {
  const i = datos.discos.findIndex((d) => d.id === id)
  const d = datos.discos[i]
  return d
    ? { id: d.id, texto: d.titulo, icono: String(d.anio), color: COLORES[i % COLORES.length] }
    : { id: 'todos', texto: 'Sorpresa', icono: '🎲', color: '#64748b' }
}

export const RULETA_DISCOS = [porcionDeDisco('todos'), ...datos.discos.map((d) => porcionDeDisco(d.id))]
