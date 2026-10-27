import { guardar, leer } from './storage.js'
import { fechaBA } from './reto.js'
import datos from './data/datos-ricotero.json'

export const COMODINES = { pista: '💡 Pista extra', mitad: '✂️ 50/50', oportunidad: '🔁 Segunda oportunidad', doble: '⭐ Puntos dobles' }
export const TIPOS = Object.keys(COMODINES)
const sortear = n => {
  // Muestreo sin sesgo; las recompensas son locales, sin dinero ni compras.
  const limite = Math.floor(4294967296/n)*n
  let v
  do { v=crypto.getRandomValues(new Uint32Array(1))[0] } while(v>=limite)
  return v%n
}
export function premiar(tipos) {
  const e=leer(), inventario={...e.bonus.inventario}
  let entregados=0
  for(const t of tipos) if(TIPOS.includes(t)&&inventario[t]<5){inventario[t]++;entregados++}
  guardar({bonus:{...e.bonus,inventario}})
  return entregados
}
export function usarComodin(tipo, accion) {
  const e=leer()
  if(!TIPOS.includes(tipo)||!e.bonus.inventario[tipo])return false
  if(accion()===false)return false
  const actual=leer()
  guardar({bonus:{...actual.bonus,inventario:{...actual.bonus.inventario,[tipo]:actual.bonus.inventario[tipo]-1}}})
  return true
}
export function tirarMoneda(eleccion, clave='diaria', caraForzada) {
  const e=leer(), b=e.bonus
  if(!['P','R'].includes(eleccion))return null
  if(clave==='diaria' ? b.monedaDia===fechaBA() : !b.monedas.includes(clave))return null
  const cara=caraForzada??['P','R'][sortear(2)], acierto=eleccion===cara
  guardar({bonus:{...b,monedaDia:clave==='diaria'?fechaBA():b.monedaDia,monedas:b.monedas.filter(k=>k!==clave),monedasJugadas:b.monedasJugadas+1,monedasAcertadas:b.monedasAcertadas+Number(acierto)}})
  const tipo=acierto?TIPOS[sortear(4)]:null
  const entregados=tipo?premiar([tipo]):0
  return {cara,acierto,tipo,entregados}
}
export function tirarDado(clave, forzado) {
  const e=leer(), b=e.bonus
  if(!b.dados.includes(clave))return null
  const cara=forzado??1+sortear(6)
  const tipos=cara<=2?[['pista','oportunidad'][sortear(2)]]:cara===5?[TIPOS[sortear(4)],TIPOS[sortear(4)]]:cara===6?['doble']:[]
  guardar({bonus:{...b,dados:b.dados.filter(k=>k!==clave),elecciones:b.elecciones+Number(cara===3||cara===4),seises:b.seises+Number(cara===6)}})
  return {cara,tipos,entregados:premiar(tipos)}
}
export function elegirPremio(tipo) {
  const e=leer()
  if(!e.bonus.elecciones||!TIPOS.includes(tipo)||e.bonus.inventario[tipo]>=5)return false
  guardar({bonus:{...e.bonus,elecciones:e.bonus.elecciones-1}})
  premiar([tipo]);return true
}
export function registrarBonusPartida({clave,modo,buenResultado,canciones=[],puntos=0}, probabilidad) {
  if(!clave||!modo)return
  const e=leer(), b=e.bonus
  if(b.partidas.includes(clave))return
  const resueltas=[...new Set([...b.canciones,...(buenResultado?canciones.flatMap(t=>{const i=datos.canciones.findIndex(c=>c.titulo===t);return i>=0?[`c:${i}`]:[]}):[])])]
  const discos=datos.discos.filter(d=>{
    const ids=datos.canciones.flatMap((c,i)=>c.disco===d.id?[`c:${i}`]:[])
    return ids.length>0&&ids.every(id=>resueltas.includes(id))
  })
  const hitos=[`primera:${modo}`,...[3,7,30].filter(n=>e.rachaMax>=n).map(n=>`racha:${n}`),...discos.map(d=>`disco:${d.id}`)]
  const nuevos=hitos.filter(h=>!b.hitos.includes(h))
  const moneda=buenResultado&&(probabilidad??sortear(4))===0
  guardar({bonus:{...b,canciones:resueltas,partidas:[...b.partidas,clave],hitos:[...b.hitos,...nuevos],dados:[...b.dados,...nuevos],monedas:moneda?[...b.monedas,clave]:b.monedas,puntos:b.puntos+(b.doble?Math.max(0,Math.floor(puntos)):0),doble:false}})
}
