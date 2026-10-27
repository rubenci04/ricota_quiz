import { crearAzar, hashSemilla } from './azar.js'
export const normalizarFrase = s => String(s).normalize('NFD').replace(/\p{M}/gu,'').toUpperCase().replace(/[^A-Z]/g,'')
const idDe = s => `f:${hashSemilla(s).toString(36)}`
export const idsFrases = ronda => ronda.flatMap(p => [p.id,idDe(p.cancion)])
const clases = new Set(['sustantivo','verbo','adjetivo'])

// La curaduría semántica es explícita por hueco; no se sortean palabras arbitrarias.
export function validarFrases(lista,{demo=false}={}) {
 const vistas=new Set(), canciones=new Set()
 return lista.flatMap(f=>{
  if(!f||typeof f.cancion!=='string'||typeof f.fragmento!=='string'||(f.ejemplo?!demo:f.aprobada!==true))return []
  const palabras=f.fragmento.trim().split(/\s+/), id=idDe(f.fragmento), cancion=f.cancion.trim().toLocaleLowerCase('es')
  if(palabras.length<5||palabras.length>10||vistas.has(id)||canciones.has(cancion)||!f.revisionOpciones||!Array.isArray(f.huecos))return []
  const huecos=f.huecos.filter(h=>{
   if(!Number.isInteger(h.indice)||h.indice<0||h.indice>=palabras.length||!clases.has(h.clase)||!Array.isArray(h.distractores)||h.distractores.length!==3)return false
   const correcta=normalizarFrase(palabras[h.indice]), opciones=[correcta,...h.distractores.map(normalizarFrase)]
   return correcta.length>=4&&new Set(opciones).size===4&&opciones.every(w=>w.length>=3&&Math.abs(w.length-correcta.length)<=3)
  })
  if(huecos.length<2||new Set(huecos.map(h=>h.indice)).size!==huecos.length||!huecos.some(h=>h.indice<palabras.length-2))return []
  vistas.add(id);canciones.add(cancion)
  return [{...f,id,palabras,huecos,album:f.album||'Sin datos de álbum'}]
 })
}
export function armarRondaFrases(lista,semilla,dif='casual',plan,opciones={}) {
 const azar=crearAzar(semilla), banco=validarFrases(lista,opciones)
 const prioridad=f=>Math.max(-1,...[f.id,idDe(f.cancion)].map(id=>(plan?.recientes?.includes(id)?10000:0)+(plan?.vistos?.lastIndexOf(id)??-1)+1))
 return azar.mezclar(banco).sort((a,b)=>prioridad(a)-prioridad(b)).slice(0,10).map(f=>{
  const cantidad=dif==='casual'?2:Math.min(f.huecos.length,2+azar.entero(2))
  const mezclados=azar.mezclar(f.huecos)
  const interior=mezclados.find(h=>h.indice<f.palabras.length-2)
  const seleccion=[interior,...mezclados.filter(h=>h!==interior)].slice(0,cantidad).sort((a,b)=>a.indice-b.indice)
  return {...f,faltantes:seleccion.map(h=>h.indice),respuesta:seleccion.map(h=>f.palabras[h.indice]).join(' '),opcionesPorHueco:Object.fromEntries(seleccion.map(h=>[h.indice,azar.mezclar([f.palabras[h.indice].replace(/[^\p{L}]/gu,''),...h.distractores])]))}
 })
}
export const semillaFrasesDia=fecha=>`fd${fecha.replaceAll('-','')}`
export const frasesDelDia=(lista,fecha,dif='casual')=>armarRondaFrases(lista,semillaFrasesDia(fecha),dif)
