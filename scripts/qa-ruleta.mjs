import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
const url='http://127.0.0.1:4184'
const servidor=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4184','--strictPort'],{windowsHide:true,stdio:'ignore'})
let browser
const informe=[]
try {
 for(let n=0;n<80;n++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
 browser=await chromium.launch({headless:true})
 for(let sector=0;sector<6;sector++){
  const reducido=sector!==3,context=await browser.newContext({viewport:{width:360,height:640},reducedMotion:reducido?'reduce':'no-preference'})
  await context.addInitScript(()=>{
   if(!localStorage.getItem('ricota_quiz'))localStorage.setItem('ricota_quiz',JSON.stringify({v:10,activo:'qa',preferencias:{tutorial:true,fondo:false,sonido:false},perfiles:[{id:'qa',alias:'QA Ruleta',progreso:{}}]}))
  })
  const page=await context.newPage(),errores=[];page.on('pageerror',e=>errores.push(e.message))
  await page.route('**/*youtube*',r=>r.abort())
  await page.goto(url);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('button',{name:/Un jugador/}).click()
  await page.getByRole('navigation',{name:'Modos de juego'}).getByRole('button',{name:/4\. Sopa/}).click()
  for(let n=0;n<7;n++){await page.getByRole('button',{name:/^💡 Pista \(/}).click();await page.mouse.move(0,0)}
  await page.getByRole('button',{name:'🪙 Sin pistas: tentá la suerte',exact:true}).click()
  await page.evaluate(n=>{crypto.getRandomValues=v=>{v.fill(n);return v}},sector)
  await page.getByRole('button',{name:'🎡 Ruleta',exact:true}).click()
  await page.waitForFunction(()=>!document.querySelector('.ruleta-disco.girando'))
  const premio=[1,2,1,3,1,2][sector]
  assert.equal(await page.getByRole('button',{name:`💡 Pista (${premio})`,exact:true}).count(),1)
  if(reducido)assert.equal(await page.locator('.ruleta-disco').evaluate(e=>getComputedStyle(e).animationName),'none')
  const disco=await page.locator('.ruleta-disco').boundingBox(),numero=await page.locator('.ruleta-disco span').nth(sector).boundingBox()
  assert.ok(Math.abs(numero.x+numero.width/2-(disco.x+disco.width/2))<2,'El sector sorteado debe quedar bajo la flecha')
  assert.ok(numero.y+numero.height/2<disco.y+disco.height/2-60)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errores,[])
  if(sector===3)await page.screenshot({path:'qa/ruleta-360.png',fullPage:true})
  informe.push({sector:sector+1,pistas:premio,reducido,flechaCorrecta:true,errores:0})
  await context.close()
 }
 writeFileSync('qa/ruleta.json',JSON.stringify(informe,null,2));console.log(JSON.stringify(informe))
}finally{await browser?.close();servidor.kill()}
