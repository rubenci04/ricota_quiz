import assert from 'node:assert/strict'
const anterior=JSON.stringify({v:9,activo:'uno',preferencias:{volumen:42,fondo:true},perfiles:[{id:'uno',alias:'Jugador uno',progreso:{partidas:12,nivel:4,mejorFrases:8,bonus:{inventario:{pista:5},doble:true,puntos:40,monedasJugadas:3,monedasAcertadas:2,seises:1},logros:{moneda1:'2026-10-27'}}}]})
const memoria=new Map([['ricota_quiz',anterior]])
globalThis.localStorage={getItem:k=>memoria.get(k)??null,setItem:(k,v)=>memoria.set(k,v)}
const s=await import('../src/storage.js'),a=await import('../src/suerte.js')
assert.equal(s.leer().partidas,12);assert.equal(s.leer().nivel,4);assert.equal(s.leer().mejorFrases,8)
assert.ok(!('bonus' in s.leer()));assert.equal(s.leer().suerte.monedasAcertadas,2);assert.equal(s.leer().suerte.seises,1)
let numero=0
const original=crypto.getRandomValues.bind(crypto)
crypto.getRandomValues=v=>{v[0]=numero;return v}
try{
 numero=0
 let r=a.tirarSuerte('trivia:ensayo','casual','moneda','P')
 assert.equal(r.cara,'P');assert.equal(r.pistas,2)
 assert.equal(a.tirarSuerte('trivia:ensayo','casual','dado'),null,'No tirar de nuevo con pistas pendientes')
 assert.equal(a.gastarPistaSuerte('trivia:ensayo'),true);assert.equal(a.gastarPistaSuerte('trivia:ensayo'),true)
 numero=1;r=a.tirarSuerte('trivia:ensayo','casual','moneda','P');assert.equal(r.pistas,1)
 a.gastarPistaSuerte('trivia:ensayo');assert.equal(a.tirarSuerte('trivia:ensayo','casual','dado'),null)
 for(let n=0;n<6;n++){
  numero=n;r=a.tirarSuerte(`dado:${n}`,'fanatico','dado')
  assert.equal(r.cara,n+1);assert.equal(r.pistas,n===5?3:n>=2?2:1)
  while(a.gastarPistaSuerte(`dado:${n}`)){}
  assert.equal(a.tirarSuerte(`dado:${n}`,'fanatico','dado'),null)
 }
 numero=0
 for(let n=0;n<6;n++){
  numero=n;const clave=`ruleta:${n}`,r=a.tirarSuerte(clave,'fanatico','ruleta')
  assert.equal(r.cara,n+1);assert.equal(r.pistas,a.PREMIOS_RULETA[n])
  assert.equal(a.tirarSuerte(clave,'fanatico','ruleta'),null)
  while(a.gastarPistaSuerte(clave)){}
  assert.equal(a.tirarSuerte(clave,'fanatico','ruleta'),null)
 }
 numero=0
 for(let n=0;n<5;n++)a.tirarSuerte(`moneda:${n}`,'fanatico','moneda','P')
 const {revisarLogros}=await import('../src/logros.js');revisarLogros()
 assert.ok(s.leer().logros.moneda5);assert.ok(s.leer().logros.dado6);assert.equal(s.leer().logros.moneda1,'2026-10-27')
 const b=s.crearPerfil('Segundo jugador');assert.equal(s.leer().suerte.tiradas,0)
 s.seleccionarPerfil('uno');assert.equal(s.leer().suerte.partidas['trivia:ensayo'].tiradas,2)
 assert.equal(JSON.parse(memoria.get('ricota_quiz')).v,10);assert.equal(memoria.get('ricota_quiz_pre_v10'),anterior)
 s.seleccionarPerfil(b);assert.equal(s.leer().suerte.monedasJugadas,0)
}finally{crypto.getRandomValues=original}
console.log('QA suerte: migración v9→v10, perfiles aislados, límites 2/1, créditos, dado, seis sectores de ruleta, premios y logros: OK.')
