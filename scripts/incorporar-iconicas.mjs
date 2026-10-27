// Curaduría de los dos listados aportados por el usuario. No importa archivos privados.
// Uso: node scripts/incorporar-iconicas.mjs <listado 1> <listado 2>
import { readFileSync, writeFileSync } from 'node:fs'
import { leerListados, auditar } from './auditar-listados.mjs'
const rutas=process.argv.slice(2)
if(rutas.length!==2)throw Error('Indicá los dos listados aportados.')
const entradas=leerListados(rutas), informe=auditar(entradas)
const norm=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z]+/g,' ').trim()
// Referencia: listado, número, primeras palabras a conservar (0 = frase entera),
// y palabras elegidas con clase gramatical y tres alternativas editoriales.
const seleccion=[
 [1,3,0,[['genios','sustantivo','relojes','barcos','tangos'],['servidores','sustantivo','pasajeros','escritores','vendedores']]],
 [1,10,0,[['brillar','verbo','correr','coser','barrer'],['amor','sustantivo','tren','mar','pan']]],
 [1,11,0,[['caballos','sustantivo','zapatos','relojes','manteles'],['mueren','verbo','bailan','cosen','saltan'],['galopar','verbo','cocinar','dibujar','estudiar']]],
 [1,13,0,[['Mordí','verbo','Cosí','Bebí','Dormí'],['anzuelo','sustantivo','mantel','tornillo','cuaderno']]],
 [1,16,0,[['pájaros','sustantivo','zapatos','relojes','clavos'],['noche','sustantivo','mesa','papel','calle'],['cantar','verbo','comer','coser','correr']]],
 [1,17,10,[['noche','sustantivo','mesa','papel','calle'],['oscura','adjetivo','redonda','dulce','pequeña']]],
 [1,18,0,[['cambiando','verbo','cocinando','barriendo','dibujando'],['asusta','verbo','regala','pinta','vende']]],
 [1,22,5,[['Medís','verbo','Cosés','Saltás','Bebés'],['acrobacia','sustantivo','carretera','lapicera','almohada']]],
 [1,26,0,[['Sobrio','adjetivo','Verde','Redondo','Dulce'],['hablar','verbo','coser','barrer','correr'],['perdido','adjetivo','cuadrado','morado','pequeño']]],
 [1,30,0,[['libertad','sustantivo','tornillo','cuaderno','mantel'],['fanática','adjetivo','redonda','pequeña','salada']]],
 [1,37,0,[['rock','sustantivo','tren','pan','reloj'],['suerte','sustantivo','mantel','rueda','cuaderno']]],
 [1,43,0,[['fuego','sustantivo','reloj','papel','botón'],['sueño','sustantivo','vaso','tren','mantel'],['duerme','verbo','cose','baila','dibuja']]],
 [1,47,0,[['late','verbo','cose','gira','pinta'],['corazón','sustantivo','mantel','tornillo','cuaderno']]],
 [1,48,0,[['futuro','sustantivo','zapato','mantel','cuaderno'],['llegó','verbo','bailó','cosió','pintó'],['esperabas','verbo','dibujabas','cocinabas','barrias']]],
 [1,50,0,[['apartando','verbo','cocinando','dibujando','barriendo'],['golpes','sustantivo','mesas','relojes','papeles'],['dolores','sustantivo','manteles','zapatos','cuadernos']]],
 [1,54,0,[['lastimé','verbo','dibujé','cociné','compré'],['labios','sustantivo','mesas','relojes','papeles'],['brindar','verbo','cocinar','barrer','dibujar']]],
 [1,58,0,[['caravanas','sustantivo','lapiceras','tornillos','cuadernos'],['quedar','verbo','coser','barrer','correr']]],
 [1,65,0,[['fugado','verbo','cosido','barrido','cocinado'],['humo','sustantivo','pan','reloj','tren'],['alarma','sustantivo','cuaderno','tornillo','mantel']]],
 [1,66,0,[['Ensayo','sustantivo','Cuaderno','Tornillo','Mantel'],['farsa','sustantivo','mesa','reloj','papel'],['teatro','sustantivo','zapato','tornillo','mantel']]],
 [1,69,0,[['efímero','adjetivo','redondo','pequeño','salado'],['corre','verbo','cose','pinta','barre'],['tiempo','sustantivo','zapato','reloj','mantel']]],
 [2,1,0,[['lujo','sustantivo','tren','pan','reloj'],['vulgaridad','sustantivo','carretera','lapicera','cuaderno']]],
 [2,2,0,[['sufriste','verbo','cosiste','barriste','cocinaste'],['cosas','sustantivo','mesas','trenes','papeles'],['mejores','adjetivo','redondas','saladas','verdes']]],
 [2,3,0,[['único','adjetivo','verde','salado','redondo'],['héroe','sustantivo','reloj','mantel','papel']]],
 [2,7,0,[['Violencia','sustantivo','Cuaderno','Tornillo','Carretera'],['mentir','verbo','coser','barrer','correr']]],
 [2,8,0,[['Vivir','verbo','Coser','Barrer','Correr'],['cuesta','verbo','dibuja','cocina','pinta'],['vida','sustantivo','tren','pan','reloj']]],
 [2,9,0,[['miel','sustantivo','tren','pan','reloj'],['comen','verbo','cosen','barren','pintan'],['hormigas','sustantivo','manteles','zapatos','cuadernos']]],
 [2,11,0,[['futuro','sustantivo','zapato','mantel','cuaderno'],['llegó','verbo','bailó','cosió','pintó']]],
 [2,14,0,[['gente','sustantivo','mesa','papel','reloj'],['decente','adjetivo','redonda','salada','pequeña'],['diferente','adjetivo','cuadrada','verde','amarilla']]],
 [2,15,0,[['testigo','sustantivo','zapato','mantel','cuaderno'],['contradecir','verbo','desatornillar','desabrochar','reconstruir']]],
 [2,18,0,[['feliz','adjetivo','verde','salado','redondo'],['hacemos','verbo','cosemos','barremos','dibujamos']]],
 [2,20,0,[['crió','verbo','cosió','barrió','pintó'],['corazón','sustantivo','mantel','tornillo','cuaderno'],['lunático','adjetivo','redondo','pequeño','salado']]],
 [2,26,0,[['reyes','sustantivo','mesas','relojes','papeles'],['viajan','verbo','cosen','barren','pintan'],['camellos','sustantivo','manteles','zapatos','cuadernos']]],
 [2,31,0,[['corazón','sustantivo','mantel','tornillo','cuaderno'],['endurece','verbo','dibuja','cocina','martilla']]],
 [2,34,0,[['abandona','verbo','dibuja','cocina','martilla'],['premio','sustantivo','zapato','mantel','cuaderno']]],
 [2,35,0,[['despedidas','sustantivo','carreteras','lapiceras','tornillos'],['dolores','sustantivo','manteles','zapatos','cuadernos'],['dulces','adjetivo','verdes','redondos','pequeños']]],
 [2,40,0,[['noche','sustantivo','mesa','papel','reloj'],['salto','sustantivo','zapato','mantel','cuaderno'],['mortal','adjetivo','redondo','pequeño','salado']]],
 [2,41,0,[['esqueleto','sustantivo','cuaderno','tornillo','lapicera'],['trajo','verbo','cosió','barrió','pintó']]],
 [2,42,0,[['reliquias','sustantivo','cuadernos','tornillos','lapiceras'],['huelen','verbo','cosen','barren','pintan']]],
 [2,44,0,[['Llorará','verbo','Coserá','Barrerá','Pintará'],['corazón','sustantivo','mantel','tornillo','cuaderno']]],
 [2,47,0,[['gana','verbo','cose','barre','pinta'],['pierde','verbo','cocina','dibuja','martilla'],['jugador','sustantivo','cuaderno','tornillo','lapicera']]],
 [2,54,0,[['buena','adjetivo','verde','redonda','salada'],['felicidad','sustantivo','carretera','lapicera','tornillo'],['dicen','verbo','cosen','barren','pintan']]],
]
const planes=new Map(seleccion.map(([l,n,c,h])=>[`${l}:${n}`,{c,h}]))
const vistas=new Set(), resultado=[]
for(let i=0;i<entradas.length;i++) {
 const e=entradas[i], a=informe[i], clave=`${norm(a.cancion)}:${norm(e.fragmento)}`
 if(vistas.has(clave))continue
 vistas.add(clave)
 const plan=planes.get(`${e.lista}:${e.numero}`)
 const f={cancion:a.cancion,fragmento:e.fragmento,aporte:{lista:e.lista,numero:e.numero},catalogada:a.estado!=='fuera-del-catalogo'}
 if(plan){
  f.fragmento=(plan.c?e.fragmento.split(/\s+/).slice(0,plan.c).join(' '):e.fragmento)
  if(f.fragmento!==e.fragmento)f.textoAportado=e.fragmento
  f.aprobada=true;f.revisionOpciones=true
  const palabras=f.fragmento.split(/\s+/)
  f.huecos=plan.h.map(([palabra,clase,...distractores])=>{
   const indice=palabras.findIndex(p=>norm(p)===norm(palabra))
   if(indice<0)throw Error(`Hueco ausente en ${e.lista}:${e.numero}`)
   return {indice,clase,distractores}
  })
 }
 resultado.push(f)
}
writeFileSync('src/data/frases-iconicas.json',JSON.stringify(resultado,null,2)+'\n')
console.log(JSON.stringify({aportesUnicos:resultado.length,jugables:resultado.filter(f=>f.aprobada).length}))
