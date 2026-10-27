// Uso: node scripts/auditar-listados.mjs <listado 1.txt> <listado 2.txt>
// El informe conserva referencias y títulos, nunca copia las letras completas.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
export function leerListados(rutas) {
 const entradas=[]
 rutas.forEach((ruta,lista)=>{
  let cancion=''
  for(const linea of readFileSync(ruta,'utf8').split(/\r?\n/)) {
   if(linea.startsWith('🔊')){cancion=linea.slice(2).trim();continue}
   const m=linea.match(/^(\d+)[.\-]?\s+(.+)$/)
   if(!m)continue
   let fragmento=m[2]
   if(lista===1){const cita=fragmento.match(/^“(.+)”\.?\s*\((.+)\)\.?$/);if(!cita)throw Error(`Formato inesperado: listado ${lista+1}, entrada ${m[1]}`);fragmento=cita[1];cancion=cita[2]}
   entradas.push({lista:lista+1,numero:Number(m[1]),cancion,fragmento})
  }
 })
 return entradas
}
export function auditar(entradas) {
 const datos=JSON.parse(readFileSync('src/data/datos-ricotero.json','utf8'))
 const banco=JSON.parse(readFileSync('src/data/frases.json','utf8'))
 const alias={'mariposa pontiac':'mariposa pontiac rock del pais'}
 const buscar=t=>datos.canciones.find(c=>norm(c.titulo)===(alias[norm(t)]??norm(t)))
 const vistos=new Set()
 return entradas.map(e=>{
  const c=buscar(e.cancion), texto=norm(e.fragmento), clave=`${norm(c?.titulo??e.cancion)}:${texto}`
  const repetida=vistos.has(clave);vistos.add(clave)
  const previas=banco.filter(f=>norm(f.cancion)===norm(c?.titulo??e.cancion))
  const estado=repetida?'repetida':!c?'fuera-del-catalogo':previas.some(f=>norm(f.fragmento)===texto)?'exacta':previas.some(f=>texto.includes(norm(f.fragmento))||norm(f.fragmento).includes(texto))?'fragmento-parcial':'nueva'
  return {lista:e.lista,numero:e.numero,cancion:c?.titulo??e.cancion,estado}
 })
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/auditar-listados.mjs')) {
 const rutas=process.argv.slice(2);if(rutas.length!==2)throw Error('Se necesitan los dos listados.')
 const detalle=auditar(leerListados(rutas))
 const cantidades=Object.fromEntries([...new Set(detalle.map(e=>e.estado))].map(estado=>[estado,detalle.filter(e=>e.estado===estado).length]))
 mkdirSync('qa',{recursive:true})
 writeFileSync('qa/listados-frases.json',JSON.stringify({total:detalle.length,cantidades,detalle},null,2))
 console.log(JSON.stringify({total:detalle.length,cantidades,fueraDelCatalogo:[...new Set(detalle.filter(e=>e.estado==='fuera-del-catalogo').map(e=>e.cancion))]},null,2))
}
