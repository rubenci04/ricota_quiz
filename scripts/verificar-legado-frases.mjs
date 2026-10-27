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
assert.ok(JSON.stringify(banco)===JSON.stringify(bancoAnterior),'El banco legado debe permanecer intacto')
for(const dif of ['casual','fanatico'])for(let i=0;i<100;i++){
 const semilla=`legado${i}`,plan={vistos:legado.idsFrases(legado.armarRondaFrases(bancoAnterior,`previa${i}`,dif)),recientes:[],ciclo:[]}
 assert.ok(JSON.stringify(armarRondaFrases(banco,semilla,dif,plan))===JSON.stringify(legado.armarRondaFrases(bancoAnterior,semilla,dif,plan)),`Replay legado ${dif}/${i}`)
}
console.log('Compatibilidad: 200 rondas y sus opciones idénticas al código y banco publicados en 766c29d: OK.')
