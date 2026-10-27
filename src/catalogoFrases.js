import aprobadas from './data/frases.json'
import ejemplos from './data/frases.ejemplos.json'
import datos from './data/datos-ricotero.json'
import { armarRondaFrases } from './frases.js'

export const demoFrases = import.meta.env.DEV && !aprobadas.some(f=>f.aprobada && !f.ejemplo)
export const catalogoFrases = (demoFrases ? ejemplos : aprobadas).map(f => ({ ...f, album: datos.discos.find(d=>d.id===datos.canciones.find(c=>c.titulo===f.cancion)?.disco)?.titulo || f.album }))
export const frasesDisponibles = armarRondaFrases(catalogoFrases, 'disponibilidad', 'casual', undefined, { demo: demoFrases }).length > 0
