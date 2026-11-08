// Compara contra el código y banco realmente publicados antes de esta tarea.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { armarRondaFrases } from '../src/frases.js'
const base='766c29d'
const anterior=execFileSync('git',['show',`${base}:src/frases.js`],{encoding:'utf8'}).replace("'./azar.js'",JSON.stringify(pathToFileURL(resolve('src/azar.js')).href))
const legado=await import(`data:text/javascript;base64,${Buffer.from(anterior).toString('base64')}`)
const bancoAnterior=JSON.parse(execFileSync('git',['show',`${base}:src/data/frases.json`],{encoding:'utf8'}))
const banco=JSON.parse(readFileSync('src/data/frases.json','utf8'))
// Los distractores se mejoraron a propósito (ver FRASES.md): las frases, huecos y respuestas deben seguir idénticos.
const sinDistractores=b=>JSON.stringify(b.map(f=>({...f,huecos:f.huecos.map(({distractores,...h})=>h)})))
assert.ok(sinDistractores(banco)===sinDistractores(bancoAnterior),'Las frases del banco legado deben permanecer intactas')
// Compara rondas sin las palabras de las opciones (sí su cantidad y orden de mezcla).
const forma=r=>JSON.stringify(r.map(f=>({...f,huecos:f.huecos.map(({distractores,...h})=>h),opcionesPorHueco:Object.fromEntries(Object.entries(f.opcionesPorHueco).map(([k,v])=>[k,v.length]))})))
for(const dif of ['casual','fanatico'])for(let i=0;i<100;i++){
 const semilla=`legado${i}`,plan={vistos:legado.idsFrases(legado.armarRondaFrases(bancoAnterior,`previa${i}`,dif)),recientes:[],ciclo:[]}
 assert.ok(forma(armarRondaFrases(banco,semilla,dif,plan))===forma(legado.armarRondaFrases(bancoAnterior,semilla,dif,plan)),`Replay legado ${dif}/${i}`)
}
console.log('Compatibilidad: 200 rondas con las mismas frases, huecos y respuestas al código y banco publicados en 766c29d: OK.')
