// Uso: node scripts/auditar-letras.mjs <carpeta privada>. Nunca imprime contenido.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@babel/parser'

const carpeta=process.argv[2]
assert.ok(carpeta,'Indicá la carpeta privada como argumento; no se incorpora al bundle.')
const norm=s=>s.normalize('NFC').toLocaleLowerCase('es').replace(/\s+/g,' ').trim()
const aprobadas=JSON.parse(readFileSync('src/data/frases.json','utf8')).filter(f=>f.aprobada&&!f.ejemplo).map(f=>norm(f.fragmento))
const datos=JSON.parse(readFileSync('src/data/datos-ricotero.json','utf8'))
// Títulos y autores son metadatos públicos, no texto de letras. Se informan aparte.
const metadatos=[...datos.canciones.flatMap(c=>[c.titulo,...(c.autores??[])]),...datos.discos.map(d=>d.titulo)].map(norm).filter(s=>s.length>=20)
const strings=[]
for(const f of readdirSync('dist/assets').filter(f=>f.endsWith('.js'))){
  const ast=parse(readFileSync(join('dist/assets',f),'utf8'),{sourceType:'module'})
  const visitar=x=>{if(!x||typeof x!=='object')return;if(x.type==='StringLiteral')strings.push(norm(x.value));for(const [k,v] of Object.entries(x)){if(['loc','start','end','extra'].includes(k))continue;if(Array.isArray(v))v.forEach(visitar);else if(v&&typeof v==='object')visitar(v)}}
  visitar(ast)
}
const ventanas=new Set()
for(const s of strings)for(let i=0;i<=s.length-20;i++)ventanas.add(s.slice(i,i+20))
let archivos=0, coincidenciasAprobadas=0, coincidenciasMetadatos=0
const noPermitidas=new Set()
for(const file of readdirSync(carpeta).filter(f=>f.endsWith('.txt'))){
  archivos++
  // Evaluar el cuerpo de cada línea, sin encabezados, numeración ni URLs.
  const texto=readFileSync(join(carpeta,file),'utf8')
  const lineas=texto.split(/\r?\n/).map(norm)
  // También cruza saltos de línea: un fragmento no puede eludir la auditoría al partirse.
  for(let s of [...lineas,norm(texto)]){
    for(const f of aprobadas)if(s.includes(f)){coincidenciasAprobadas++;s=s.split(f).join('\u0000')}
    for(const m of metadatos)if(s.includes(m)){coincidenciasMetadatos++;s=s.split(m).join('\u0000')}
    for(let i=0;i<=s.length-20;i++){
      const ventana=s.slice(i,i+20)
      if(!ventana.includes('\u0000')&&ventanas.has(ventana))noPermitidas.add(ventana)
    }
  }
}
const informe={archivos,fragmentosAprobados:aprobadas.length,coincidenciasAprobadas,coincidenciasMetadatos,coincidenciasNoAutorizadas20:noPermitidas.size}
console.log(JSON.stringify(informe))
assert.equal(noPermitidas.size,0,'Se detectaron coincidencias de 20 caracteres fuera de fragmentos aprobados y metadatos públicos; no se imprime el texto.')
const bundle=readdirSync('dist/assets').filter(f=>f.endsWith('.js')).map(f=>readFileSync(join('dist/assets',f),'utf8')).join('')
assert.ok(!/[A-Z]:[\\/](?:Users|proyectos)|_privado[\\/]|letras_privadas/i.test(bundle),'Ruta privada en bundle')
for(const f of JSON.parse(readFileSync('src/data/frases.ejemplos.json','utf8')))assert.ok(!bundle.includes(f.fragmento),'Ejemplo DEV en bundle')
for(const f of JSON.parse(readFileSync('src/data/interpretaciones.json','utf8')).filter(f=>!f.verificada||!f.fuente?.url))assert.ok(!bundle.includes(f.resumen),'Interpretación sin verificar en bundle')
writeFileSync('qa/auditoria-letras.json',JSON.stringify(informe,null,2))
