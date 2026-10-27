import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const url='http://127.0.0.1:4182', servidor=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4182','--strictPort'],{windowsHide:true,stdio:'ignore'})
let browser
const informe=[]
try{
 for(let n=0;n<80;n++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({headless:true})
 for(const reducido of [false,true]){
  const context=await browser.newContext({viewport:{width:360,height:640},reducedMotion:reducido?'reduce':'no-preference'})
  await context.addInitScript(()=>{
   if(!localStorage.getItem('ricota_quiz'))localStorage.setItem('ricota_quiz',JSON.stringify({v:9,activo:'qa',preferencias:{tutorial:true,fondo:false},perfiles:[{id:'qa',alias:'QA Suerte',progreso:{bonus:{inventario:{pista:5},monedasAcertadas:3},partidas:20}}]}))
  })
  const page=await context.newPage(),errores=[]
  page.on('pageerror',e=>errores.push(e.message))
  await page.route('**/*youtube*',r=>r.abort())
  await page.goto(url);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('button',{name:/Un jugador/}).click()
  assert.equal(await page.getByText(/Moneda diaria|Comodines|Vuelve mañana/).count(),0)
  const agotar=async()=>{
   for(let n=0;n<10;n++){
    const b=page.getByRole('button',{name:/^💡 Pista \(/})
    if(!await b.count())return
    await b.click();await page.mouse.move(0,0)
   }
   throw new Error('La pista no se agota')
  }
  const forzar=async n=>page.evaluate(n=>{crypto.getRandomValues=v=>{v.fill(n);return v}},n)
  const estadisticas=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('ricota_quiz')).perfiles[0].progreso.suerte)
  await page.getByRole('navigation',{name:'Modos de juego'}).getByRole('button',{name:/4\. Sopa/}).click()
  await agotar();await page.getByRole('button',{name:'🪙 Sin pistas: tentá la suerte',exact:true}).click()
  await page.getByRole('button',{name:'🪙 Moneda',exact:true}).click()
  await forzar(0);await page.getByRole('button',{name:'Elegir P',exact:true}).click()
  assert.equal(await page.locator('.moneda-cara').count(),2);assert.equal(await page.locator('.moneda-canto').count(),16)
  if(reducido)assert.equal(await page.locator('.suerte-objeto').evaluate(e=>getComputedStyle(e).animationName),'none')
  await page.waitForFunction(()=>!document.querySelector('.suerte-objeto.lanzando'))
  assert.ok(await page.getByRole('button',{name:'💡 Pista (2)',exact:true}).count())
  await page.screenshot({path:`qa/moneda-${reducido?'quieta':'animada'}.png`,fullPage:true})
  await agotar();await page.getByRole('button',{name:'🪙 Sin pistas: tentá la suerte',exact:true}).click()
  await forzar(5);await page.getByRole('button',{name:'🎲 Dado',exact:true}).click()
  await page.waitForFunction(()=>!document.querySelector('.suerte-objeto.lanzando'))
  assert.equal(await page.locator('.suerte-cara').count(),6)
  assert.equal(await page.locator('.cara-6 .punto').count(),6)
  const rotaciones={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]}
  for(const [cara,[x,y]] of Object.entries(rotaciones)){
    const visible=await page.locator('.suerte-objeto.dado').evaluate((e,{x,y})=>{
      e.style.setProperty('--rx',`${x}deg`);e.style.setProperty('--ry',`${y}deg`)
      const b=e.getBoundingClientRect(),elemento=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)
      return elemento?.closest('.suerte-cara')?.className
    },{x,y})
    assert.ok(visible?.includes(`cara-${cara}`),`La cara visible no coincide con ${cara}`)
  }
  assert.ok((await estadisticas()).seises>=1)
  await page.screenshot({path:`qa/dado-${reducido?'quieto':'animado'}.png`,fullPage:true})
  assert.equal(await page.getByRole('button',{name:'🪙 Sin pistas: tentá la suerte',exact:true}).count(),0)
  await page.getByRole('button',{name:'Ir al menú principal'}).click()
  await page.getByRole('navigation',{name:'Modos de juego'}).getByRole('button',{name:/3\. Crucigrama/}).click()
  await page.getByRole('group',{name:'Dificultad',exact:true}).getByRole('button',{name:/Ricotero/}).click()
  await agotar();await page.getByRole('button',{name:'🪙 Sin pistas: tentá la suerte',exact:true}).click()
  await forzar(5);await page.getByRole('button',{name:'🎲 Dado',exact:true}).click()
  await page.waitForFunction(()=>!document.querySelector('.suerte-objeto.lanzando'))
  await agotar()
  assert.ok(await page.getByRole('button',{name:'Sin pistas · límite de tiradas alcanzado',exact:true}).isDisabled())
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  const persistido=await page.evaluate(()=>JSON.parse(localStorage.getItem('ricota_quiz')))
  assert.equal(persistido.v,10);assert.ok(!('bonus' in persistido.perfiles[0].progreso))
  assert.deepEqual(errores,[])
  informe.push({reducido,monedaDosCaras:true,dadoSeisCaras:true,limiteCasual:2,limiteRicotero:1,desborde:false,errores:0})
  await context.close()
 }
 writeFileSync('qa/suerte.json',JSON.stringify(informe,null,2));console.log(JSON.stringify(informe))
}finally{await browser?.close();servidor.kill()}
