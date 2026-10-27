import assert from 'node:assert/strict'
import datos from '../src/data/datos-ricotero.json'
import { armarCasillas } from '../src/adivinanza.js'
import { prepararLetras, prepararLetrasDicho } from '../src/letrasIniciales.js'
let palabras=0,casos=0
const titulos=[...datos.canciones.map(c=>c.titulo),'A la luz','Yo no me caí del cielo','Una palabraextremadamentelarga']
for(const titulo of titulos)for(const dif of ['casual','fanatico'])for(let i=0;i<10;i++){
 const grupos=armarCasillas(titulo),semilla=`menosayuda${i}`
 const antes=prepararLetras(grupos,dif,semilla),ahora=prepararLetrasDicho(grupos,dif,semilla)
 let inicio=0
 for(const grupo of grupos){
  const fin=inicio+grupo.letras.length
  const cantidadAntes=antes.iniciales.slice(inicio,fin).filter(Boolean).length
  const cantidadAhora=ahora.iniciales.slice(inicio,fin).filter(Boolean).length
  assert.equal(cantidadAhora,Math.max(0,cantidadAntes-1),'Una letra inicial menos por palabra')
  if(grupo.letras.length)assert.ok(cantidadAhora<grupo.letras.length,'Ninguna palabra debe aparecer completa')
  inicio=fin;palabras++
 }
 assert.ok(ahora.letras.some(l=>!l),'Siempre hay algo para resolver')
 assert.ok(!ahora.fijas[ahora.foco],'El foco debe estar en una casilla editable')
 assert.deepEqual(ahora,prepararLetrasDicho(grupos,dif,semilla),'Ayudas reproducibles')
 assert.deepEqual(antes,prepararLetras(grupos,dif,semilla),'Adiviná por palabras conserva sus ayudas')
 casos++
}
console.log(JSON.stringify({casos,palabras,unaAyudaMenosPorPalabra:true,ningunaPalabraCompleta:true,reproducibles:true}))
