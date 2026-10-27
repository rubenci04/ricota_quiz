import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { armarRondaFrases, frasesDelDia, idsFrases, normalizarFrase, validarFrases } from '../src/frases.js'

// Datos sintéticos en memoria: nunca se incorporan al catálogo de producción.
const palabras = ['ventanas','senderos','jardines','estrellas','bosques','caminos','linternas','cuadernos','puentes','viajeros','colores','piedras']
const banco = palabras.map((p,i)=>({ cancion:`Ensayo ${i}`, fragmento:`Los dibujos muestran ${p} cada mañana`, faltantes:[3], aprobada:true }))
for (const dif of ['casual','fanatico']) for(let n=0;n<100;n++) {
  const plan={vistos:[],recientes:[],ciclo:[]}
  const r=armarRondaFrases(banco,`ensayo${n}`,dif,plan)
  assert.equal(r.length,10)
  assert.equal(new Set(r.map(f=>f.id)).size,10)
  assert.equal(new Set(r.map(f=>f.cancion)).size,10)
  assert.deepEqual(r,armarRondaFrases(banco,`ensayo${n}`,dif,plan))
  if(dif==='casual') for(const f of r){assert.equal(new Set(f.opciones.map(normalizarFrase)).size,4);assert.ok(f.opciones.includes(f.respuesta))}
}
assert.deepEqual(armarRondaFrases(banco.slice(0,9),'ensayo','casual'),[])
assert.deepEqual(armarRondaFrases([...banco,...banco].map(f=>({...f,cancion:'Una sola'})),'ensayo','fanatico'),[])
assert.deepEqual(frasesDelDia(banco,'2026-10-27'),frasesDelDia(banco,'2026-10-27'))
assert.equal(normalizarFrase('cañón'),'CANON')
const ejemplos=JSON.parse(readFileSync('src/data/frases.ejemplos.json','utf8'))
assert.equal(ejemplos.length,6)
assert.equal(validarFrases(ejemplos).length,0)
assert.equal(armarRondaFrases(ejemplos,'ensayo','casual',undefined,{demo:true}).length,6)
assert.deepEqual(JSON.parse(readFileSync('src/data/frases.json','utf8')),[])

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
assert.equal(guardado.v,8);assert.ok(memoria.get('ricota_quiz_pre_v8'))
const {crearLink,leerDesafio}=await import('../src/desafio.js')
const plan={vistos:idsFrases(armarRondaFrases(banco,'anterior')),recientes:[],ciclo:[]}
const d={modo:'frases',dif:'casual',semilla:'abcd1234',puntaje:8,plan}
const recibido=leerDesafio(new URL(crearLink({...d,alias:'PRIVADO'})).hash)
assert.deepEqual(armarRondaFrases(banco,d.semilla,d.dif,d.plan),armarRondaFrases(banco,recibido.semilla,recibido.dif,recibido.plan))
assert.ok(!crearLink({...d,alias:'PRIVADO'}).includes('PRIVADO'))
for(const ronda of ['dichocanciones','dichodiscos','dichopalabras','dichointegrantes']) assert.ok(leerDesafio(`#/desafio/adivinanzas/${ronda}/casual/abcd1234/1`))
const js=readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>readFileSync(`dist/assets/${f}`,'utf8')).join('\n')
for(const e of ejemplos){assert.ok(!js.includes(e.fragmento));assert.ok(!js.includes(e.cancion))}
console.log('QA frases: 200 rondas de 10 sin duplicados, semillas, demo DEV, banco vacío, migración v7→v8, dos perfiles, logros y enlaces compatibles: OK.')
