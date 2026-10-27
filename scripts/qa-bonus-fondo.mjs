import assert from 'node:assert/strict'
import { chromium, firefox } from '@playwright/test'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const url='http://127.0.0.1:4178'
const servidor=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4178','--strictPort'],{windowsHide:true,stdio:'ignore'})
const informe=[]
try {
  for(let i=0;i<80;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
  for(const [nombre,motor] of [['Chromium',chromium],['Firefox',firefox]]){
    let browser
    try { browser=await motor.launch({headless:true}) }
    catch(e){
      if(nombre!=='Firefox')throw e
      informe.push({navegador:nombre,noVerificado:true,motivo:'Firefox instalado; Windows rechazó iniciar el ejecutable (spawn UNKNOWN).'});continue
    }
    try{
      for(const respaldo of [false,true]){
        const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
        await context.addInitScript(({respaldo})=>{
          if(respaldo)HTMLCanvasElement.prototype.getContext=()=>null
          else {
            // Simular disponibilidad de aceleración para cubrir también el motor 2D.
            const original=HTMLCanvasElement.prototype.getContext
            HTMLCanvasElement.prototype.getContext=function(tipo,...args){return tipo==='webgl'?{getExtension:()=>null}:original.call(this,tipo,...args)}
          }
          if(!localStorage.getItem('ricota_quiz'))localStorage.setItem('ricota_quiz',JSON.stringify({v:8,activo:'qa',preferencias:{tutorial:true,fondo:true},perfiles:[{id:'qa',alias:'QA Fondo',progreso:{bonus:{inventario:{pista:2,mitad:2,oportunidad:2,doble:2}}}}]}))
          window.YT={PlayerState:{PLAYING:1,ENDED:0},Player:class{
            constructor(destino,o){this.iframe=document.createElement('iframe');this.iframe.width=200;this.iframe.height=200;destino.append(this.iframe);queueMicrotask(()=>o.events.onReady({target:this}))}
            getPlaylist(){return ['uno']}getPlayerState(){return 2}loadPlaylist(){}playVideo(){}pauseVideo(){}nextVideo(){}stopVideo(){}destroy(){this.iframe.remove()}mute(){}unMute(){}setVolume(){}setShuffle(){}setLoop(){}
          }}
        },{respaldo})
        const page=await context.newPage(),errores=[]
        page.on('pageerror',e=>errores.push(e.message))
        await page.goto(url);await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('button',{name:/Un jugador/}).click()
        await page.getByRole('button',{name:'Ayuda y ajustes',exact:true}).click()
        await page.getByText('Fondo: reducir movimiento del sistema',{exact:true}).waitFor()
        await page.getByRole('button',{name:'Desactivar fondo animado',exact:true}).click()
        await page.getByText('Fondo: animación desactivada por vos',{exact:true}).waitFor()
        await page.getByRole('button',{name:'Activar fondo animado',exact:true}).click()
        await page.getByText(/Fondo: activo \([1-9]\d* fps\)/).waitFor({timeout:15000})
        const estado=await page.getByText(/Fondo: activo/).textContent()
        if(respaldo){
          const elemento=page.locator('.fondo-respaldo i').first()
          const antes=await elemento.evaluate(e=>getComputedStyle(e).transform)
          await page.waitForTimeout(250)
          const despues=await elemento.evaluate(e=>getComputedStyle(e).transform)
          assert.notEqual(antes,despues,'Respaldo CSS no se mueve con activación explícita')
        }else{
          const antes=await page.locator('canvas.fondo-animado').evaluate(e=>e.toDataURL())
          await page.waitForTimeout(200)
          const despues=await page.locator('canvas.fondo-animado').evaluate(e=>e.toDataURL())
          assert.notEqual(antes,despues,'Canvas no cambia')
        }
        await page.getByRole('button',{name:'Saltar',exact:true}).click()
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
        assert.deepEqual(errores,[])
        informe.push({navegador:nombre,respaldo,estado,overrideReducirMovimiento:true,errores:0})
        await context.close()
      }
    }finally{await browser.close()}
  }
  writeFileSync('qa/bonus-fondo.json',JSON.stringify(informe,null,2));console.log(JSON.stringify(informe))
} finally {servidor.kill()}
