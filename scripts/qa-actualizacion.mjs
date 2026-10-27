import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { chromium } from '@playwright/test'

let revision=1, browser
const raiz=resolve('dist'), tipos={'.js':'text/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'}
const servidor=createServer((req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname
  const archivo=resolve(raiz,'.'+(path==='/'?'/index.html':path))
  if(!archivo.startsWith(raiz+sep)||!existsSync(archivo)){res.writeHead(404);res.end();return}
  res.setHeader('Content-Type',tipos[extname(archivo)]??'application/octet-stream');res.setHeader('Cache-Control','no-store')
  const bytes=readFileSync(archivo)
  res.end(path==='/sw.js'?Buffer.concat([bytes,Buffer.from(`\n// QA revisión ${revision}`)]):bytes)
})
await new Promise(r=>servidor.listen(4180,'127.0.0.1',r))
try{
  browser=await chromium.launch({headless:true})
  const page=await browser.newPage({viewport:{width:360,height:640}})
  await page.goto('http://127.0.0.1:4180/')
  await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.active,{timeout:20000})
  await page.reload()
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller)
  revision=2
  await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update()})
  await page.getByRole('button',{name:'Actualizar',exact:true}).waitFor({timeout:20000})
  assert.ok(await page.getByText('Hay una versión nueva',{exact:false}).count())
  await Promise.all([page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame()}),page.getByRole('button',{name:'Actualizar',exact:true}).click()])
  await page.waitForLoadState('domcontentloaded')
  await page.getByRole('button',{name:'Actualizar',exact:true}).waitFor({state:'detached'})
  writeFileSync('qa/actualizacion.json',JSON.stringify({registro:true,aviso:true,actualizarYRecargar:true},null,2))
  console.log('QA PWA: SW instalado, nueva versión detectada, aviso visible y actualización con recarga: OK.')
}finally{await browser?.close();await new Promise(r=>servidor.close(r))}
