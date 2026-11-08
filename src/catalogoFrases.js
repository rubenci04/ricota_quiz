import aprobadas from './data/frases.json'
import ejemplos from './data/frases.ejemplos.json'
import iconicas from './data/frases-iconicas.json'
import datos from './data/datos-ricotero.json'
import { armarRondaFrases } from './frases.js'

export const demoFrases = import.meta.env.DEV && !aprobadas.some(f=>f.aprobada && !f.ejemplo)
export const catalogoFrases = (demoFrases ? ejemplos : aprobadas).map(f => ({ ...f, album: datos.discos.find(d=>d.id===datos.canciones.find(c=>c.titulo===f.cancion)?.disco)?.titulo || f.album }))
export const aportesFrases = iconicas
export const catalogoIconicas = [...iconicas.filter(f=>f.aprobada),...catalogoFrases].map(f=>({...f,album:datos.discos.find(d=>d.id===datos.canciones.find(c=>c.titulo===f.cancion)?.disco)?.titulo||f.album}))
// Los enlaces anteriores conservan el banco y algoritmo originales.
export const generarFrases = (semilla,dif,plan,version=2) => armarRondaFrases(version===1?catalogoFrases:catalogoIconicas,semilla,dif,plan,{demo:demoFrases,variantes:version===2})
export const frasesDisponibles = generarFrases('disponibilidad','casual').length >= 10
