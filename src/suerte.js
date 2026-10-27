import { guardar, leer } from './storage.js'

export function sortear(entero) {
  const limite=Math.floor(4294967296/entero)*entero
  let n
  do { n=crypto.getRandomValues(new Uint32Array(1))[0] } while(n>=limite)
  return n%entero
}
export const limiteTiradas=dif=>dif==='fanatico'?1:2
export const estadoSuerte=clave=>leer().suerte.partidas[clave]??{tiradas:0,pistas:0}
export function tirarSuerte(clave,dif,tipo,eleccion) {
  if(!clave||!['moneda','dado'].includes(tipo)||(tipo==='moneda'&&!['P','R'].includes(eleccion)))return null
  const e=leer(), partida=estadoSuerte(clave)
  if(partida.tiradas>=limiteTiradas(dif)||partida.pistas>0)return null
  const cara=tipo==='moneda'?['P','R'][sortear(2)]:sortear(6)+1
  const acierto=tipo==='moneda'&&cara===eleccion
  const pistas=tipo==='moneda'?(acierto?2:1):cara===6?3:cara>=3?2:1
  guardar({suerte:{...e.suerte,tiradas:e.suerte.tiradas+1,monedasJugadas:e.suerte.monedasJugadas+Number(tipo==='moneda'),monedasAcertadas:e.suerte.monedasAcertadas+Number(acierto),seises:e.suerte.seises+Number(tipo==='dado'&&cara===6),partidas:{...e.suerte.partidas,[clave]:{tiradas:partida.tiradas+1,pistas:partida.pistas+pistas}}}})
  return {tipo,cara,acierto,pistas}
}
export function gastarPistaSuerte(clave) {
  const e=leer(), p=estadoSuerte(clave)
  if(p.pistas<1)return false
  guardar({suerte:{...e.suerte,partidas:{...e.suerte.partidas,[clave]:{...p,pistas:p.pistas-1}}}})
  return true
}
