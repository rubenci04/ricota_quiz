import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { armarRondaFrases, frasesDelDia, idsFrases, normalizarFrase, validarFrases } from '../src/frases.js'

const banco=JSON.parse(readFileSync('src/data/frases.json','utf8'))
assert.ok(banco.length>=30&&banco.length<=40)
assert.equal(validarFrases(banco).length,banco.length)
assert.equal(new Set(banco.map(f=>f.cancion)).size,banco.length)
for(const dif of ['casual','fanatico'])for(let n=0;n<100;n++){
 const plan={vistos:[],recientes:[],ciclo:[]},semilla=`ensayo${n}`
 const r=armarRondaFrases(banco,semilla,dif,plan)
 assert.equal(r.length,10);assert.equal(new Set(r.map(f=>f.id)).size,10);assert.equal(new Set(r.map(f=>f.cancion)).size,10)
 assert.ok(JSON.stringify(r)===JSON.stringify(armarRondaFrases(banco,semilla,dif,plan)),'Replay reproducible')
 for(const f of r){
  assert.ok(f.faltantes.length===(dif==='casual'?2:f.faltantes.length)&&f.faltantes.length>=2&&f.faltantes.length<=3)
  assert.ok(f.faltantes.some(n=>n<f.palabras.length-2),'Debe haber un hueco dentro de la frase')
  for(const indice of f.faltantes){const opciones=f.opcionesPorHueco[indice];assert.equal(new Set(opciones.map(normalizarFrase)).size,4);assert.equal(opciones.filter(p=>normalizarFrase(p)===normalizarFrase(f.palabras[indice])).length,1)}
 }
}
assert.equal(armarRondaFrases(banco.slice(0,7),'ensayo').length,7)
assert.equal(armarRondaFrases([...banco,...banco].map(f=>({...f,cancion:'Una sola'})),'ensayo').length,1)
assert.ok(JSON.stringify(frasesDelDia(banco,'2026-10-27'))===JSON.stringify(frasesDelDia(banco,'2026-10-27')))
assert.equal(normalizarFrase('cañón'),'CANON')
const ejemplos=JSON.parse(readFileSync('src/data/frases.ejemplos.json','utf8'))
assert.equal(validarFrases(ejemplos).length,0)
const mutilada={...banco[0],huecos:banco[0].huecos.map(h=>({...h,distractores:['igual','igual','igual']}))}
assert.equal(validarFrases([mutilada]).length,0)

const progreso={nivel:4,mejor:9,nivelBanda:3,mejorBanda:8,partidas:12,logros:{primera:'2026-10-25'},historial:{dichodiscos:{vistos:['a:1'],partidas:[],ciclo:[]}}}
const memoria=new Map([['ricota_quiz',JSON.stringify({v:7,activo:'uno',preferencias:{fondo:false,volumen:42,dificultad:'fanatico'},perfiles:[{id:'uno',alias:'Primer alias',progreso}]})]])
globalThis.localStorage={getItem:k=>memoria.get(k)??null,setItem:(k,v)=>memoria.set(k,v)}
const s=await import('../src/storage.js')
assert.equal(s.leer().nivelBanda,3)
s.guardar({frasesPartidas:1,mejorFrases:10,frasesSinPistas:true})
const segundo=s.crearPerfil('Segundo alias')
assert.equal(s.leer().mejorFrases,0);assert.equal(s.leer().nivelBanda,1)
s.seleccionarPerfil('uno')
assert.equal(s.leer().mejorFrases,10);assert.equal(s.leer().nivel,4);assert.equal(s.leer().mejorBanda,8)
assert.deepEqual(s.leer().historial.dichodiscos.vistos,['a:1'])
assert.equal(s.leer().volumen,42);assert.equal(s.leer().fondo,false)
const { revisarLogros }=await import('../src/logros.js')
revisarLogros();assert.ok(s.leer().logros.frases10)
s.seleccionarPerfil(segundo);assert.ok(!s.leer().logros.frases10)
const guardado=JSON.parse(memoria.get('ricota_quiz'))
assert.equal(guardado.v,10);assert.ok(memoria.get('ricota_quiz_pre_v8'))
const {crearLink,leerDesafio}=await import('../src/desafio.js')
const iconicas=JSON.parse(readFileSync('src/data/frases-iconicas.json','utf8'))
assert.equal(iconicas.length,131)
assert.equal(validarFrases(iconicas,{variantes:true}).length,41)
const nuevo=[...iconicas,...banco]
for(let n=0;n<200;n++){
 const semilla=`iconicas${n}`,plan={vistos:[],recientes:[],ciclo:[]}
 const r=armarRondaFrases(nuevo,semilla,'casual',plan,{variantes:true})
 assert.equal(r.length,10);assert.equal(new Set(r.map(f=>f.cancion.toLowerCase())).size,10)
 assert.ok(JSON.stringify(r)===JSON.stringify(armarRondaFrases(nuevo,semilla,'casual',plan,{variantes:true})))
}
const nv={modo:'frases',versionFrases:2,dif:'fanatico',semilla:'iconicas1',puntaje:5,plan:{vistos:[],recientes:[],ciclo:[]}}
const replay=leerDesafio(new URL(crearLink(nv)).hash)
assert.equal(replay.versionFrases,2)
assert.equal(replay.version,3)
assert.ok(JSON.stringify(armarRondaFrases(nuevo,nv.semilla,nv.dif,nv.plan,{variantes:true}))===JSON.stringify(armarRondaFrases(nuevo,replay.semilla,replay.dif,replay.plan,{variantes:true})))
assert.equal(leerDesafio('#/desafio/frases/todos.todos/casual/abcd1234/3').versionFrases,1)
const plan={vistos:idsFrases(armarRondaFrases(banco,'anterior')),recientes:[],ciclo:[]}
const d={modo:'frases',dif:'casual',semilla:'abcd1234',puntaje:8,plan}
const recibido=leerDesafio(new URL(crearLink({...d,alias:'PRIVADO'})).hash)
assert.ok(JSON.stringify(armarRondaFrases(banco,d.semilla,d.dif,d.plan))===JSON.stringify(armarRondaFrases(banco,recibido.semilla,recibido.dif,recibido.plan)))
assert.ok(!crearLink({...d,alias:'PRIVADO'}).includes('PRIVADO'))
for(const ronda of ['dichocanciones','dichodiscos','dichopalabras','dichointegrantes']) assert.ok(leerDesafio(`#/desafio/adivinanzas/${ronda}/casual/abcd1234/1`))
const js=readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>readFileSync(`dist/assets/${f}`,'utf8')).join('\n')
for(const e of ejemplos){assert.ok(!js.includes(e.fragmento));assert.ok(!js.includes(e.cancion))}
console.log('QA frases: 400 rondas de 10, bancos v1/v2, 75 variantes/49 canciones, 131 aportes, 41 curados, perfiles, logros y enlaces compatibles: OK.')
