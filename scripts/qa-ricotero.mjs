import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const dev=process.argv.includes('--dev'), port=dev?4176:4175, url=`http://127.0.0.1:${port}`
const servidor=spawn(process.execPath,['node_modules/vite/bin/vite.js',...(dev?[]:['preview']),'--host','127.0.0.1','--port',String(port),'--strictPort'],{windowsHide:true,stdio:'ignore'})
let browser
const informe=[]
try {
  for(let i=0;i<80;i++){try{if((await fetch(url)).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
  browser=await chromium.launch({headless:true})
  for(const width of [360,375,390,1280]){
    const context=await browser.newContext({viewport:{width,height:width===360?640:width===390?844:720},reducedMotion:'reduce'})
    await context.addInitScript(()=>{
      window.YT={PlayerState:{PLAYING:1,ENDED:0},Player:class{
        constructor(destino,opciones){this.estado=2;this.opciones=opciones;this.iframe=document.createElement('iframe');this.iframe.width=200;this.iframe.height=200;destino.append(this.iframe);queueMicrotask(()=>opciones.events.onReady({target:this}))}
        getPlaylist(){return ['uno','dos']}getPlayerState(){return this.estado}loadPlaylist(){this.playVideo()}
        playVideo(){this.estado=1}pauseVideo(){this.estado=2}nextVideo(){}stopVideo(){}destroy(){this.iframe.remove()}mute(){}unMute(){}setVolume(){}setShuffle(){}setLoop(){}
      }}
    })
    const page=await context.newPage(),errores=[]
    page.on('pageerror',e=>errores.push(e.message))
    await page.goto(url)
    await page.getByLabel('Crear perfil',{exact:true}).fill('QA Ricotero')
    await page.getByRole('button',{name:'Crear y jugar'}).click()
    await page.getByRole('button',{name:'Saltar',exact:true}).click()
    await page.getByRole('button',{name:/Un jugador/}).click()
    const check=async nombre=>{
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}: ${nombre} desborda`)
      assert.equal(await page.locator('html').getAttribute('data-tema'),'oscuro')
    }
    const menu=()=>page.getByRole('navigation',{name:'Modos de juego'})
    assert.equal(await menu().getByRole('button').count(),6)
    assert.equal(await menu().getByRole('button',{name:/1. Completá/}).isDisabled(),false)
    await check('menú');await page.screenshot({path:`qa/ricotero-${dev?'dev-':''}${width}.png`,fullPage:true})
    for(const [numero,nombre] of [[2,'Dicho de otra forma'],[3,'Crucigrama'],[4,'Sopa de letras'],[5,'Trivia'],[6,'Adiviná por palabras']]){
      await menu().getByRole('button',{name:new RegExp(`${numero}\\. ${nombre}`)}).click()
      await check(nombre)
      const dificultad=page.getByRole('group',{name:'Dificultad',exact:true})
      assert.equal(await dificultad.getByRole('button',{name:/Casual/}).getAttribute('aria-pressed'),'true')
      if(numero===2){assert.equal(await page.getByRole('button',{name:/Discos|Integrantes/,exact:true}).count(),0);await dificultad.getByRole('button',{name:/Ricotero/}).click();await page.getByRole('button',{name:'Jugar',exact:true}).click();await check('Dicho partida')}
      if(numero===5){
        await page.getByRole('group',{name:'Categoría de trivia'}).getByRole('button',{name:'La banda',exact:true}).click()
        await page.getByRole('button',{name:/Nivel 1/}).click();await check('La banda partida')
      }
      await page.getByRole('button',{name:'Ir al menú principal'}).click()
    }
    await page.getByRole('button',{name:/Reto del día/}).click();await check('reto');await page.getByRole('button',{name:'Ir al menú principal'}).click()
    await page.getByRole('navigation',{name:'Secciones principales'}).getByRole('button',{name:/Archivo/}).click()
    for(const nombre of ['Discografía','Palabras','Curiosidades','Frases']){await page.getByRole('group',{name:'Archivo',exact:true}).getByRole('button',{name:nombre,exact:true}).click();await check(nombre)}
    assert.equal(await page.locator('.coleccion-frases article').count(),131)
    await page.getByRole('searchbox').fill('vulgaridad');assert.equal(await page.locator('.coleccion-frases article').count(),1)
    await page.getByRole('button',{name:'Ir al menú principal'}).click()
    await page.getByRole('navigation',{name:'Secciones principales'}).getByRole('button',{name:/Logros/}).click();assert.ok(await page.getByText('QA Ricotero',{exact:true}).count());await check('logros')
    await page.getByRole('button',{name:'Ir al menú principal'}).click()
    await menu().getByRole('button',{name:/1. Completá/}).click()
    await page.getByRole('button',{name:'Jugar',exact:true}).click()
    assert.equal(await page.getByRole('button',{name:/^Hueco [12]$/}).count(),2)
    await page.getByRole('button',{name:'Hueco 1',exact:true}).click()
    await page.getByRole('button',{name:/^💡 Pista/}).click()
    assert.equal(await page.locator('.opciones button:disabled').count(),2)
    await page.locator('.opciones button:not(:disabled)').first().click()
    await page.locator('.opciones button').first().click()
    await page.getByRole('button',{name:'Comprobar',exact:true}).click()
    await page.getByRole('button',{name:'Siguiente frase',exact:true}).click();await check('frases Casual')
    for(let n=1;n<10;n++){
      await page.getByRole('button',{name:'Pasar',exact:true}).click()
      await page.getByRole('button',{name:n===9?'Ver resultado':'Siguiente frase',exact:true}).click()
    }
    assert.ok(await page.getByRole('region',{name:'Resultado'}).count())
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('ricota_quiz')).perfiles[0].progreso.frasesPartidas),1)
    await page.getByRole('button',{name:'Otra ronda de 10 frases',exact:true}).click()
    assert.ok(await page.getByText('Frase 1/10',{exact:false}).count())
    assert.equal(await page.getByRole('button',{name:'💡 Pista (4)',exact:true}).count(),1)
    await page.screenshot({path:`qa/frases-casual-${width}.png`,fullPage:true})
    await page.getByRole('button',{name:'Ir al menú principal'}).click()
    await menu().getByRole('button',{name:/1. Completá/}).click()
    await page.getByRole('group',{name:'Dificultad',exact:true}).getByRole('button',{name:/Ricotero/}).click()
    await page.getByRole('button',{name:'Jugar',exact:true}).click()
    const letras=await page.locator('.frase-casillas button').count()
    assert.ok((await page.locator('.frase-casillas button').first().boundingBox()).width>=39)
    await page.screenshot({path:`qa/frases-ricotero-${width}.png`,fullPage:true})
    await page.keyboard.type('x'.repeat(letras));await page.keyboard.press('Enter');await page.keyboard.press('Enter')
    assert.equal(await page.locator('.frase-casillas button:disabled').count(),1)
    await check('frases Ricotero')
    await page.getByRole('button',{name:'Pasar',exact:true}).click()
    await page.getByRole('button',{name:'Ir al menú principal'}).click()
    await page.reload();assert.equal(await page.getByLabel('Crear perfil',{exact:true}).count(),0)
    const persistido=await page.evaluate(()=>JSON.parse(localStorage.getItem('ricota_quiz')))
    assert.equal(persistido.v,10);assert.equal(persistido.perfiles[0].alias,'QA Ricotero')
    if(!dev && width===360){
      await page.evaluate(()=>navigator.serviceWorker.ready)
      await page.reload()
      await context.setOffline(true)
      await page.reload()
      await page.getByRole('button',{name:'Entrar',exact:true}).click()
      await page.getByRole('button',{name:/Un jugador/}).click()
      assert.equal(await menu().getByRole('button').count(),6)
      await menu().getByRole('button',{name:/5\. Trivia/}).click()
      await page.getByRole('button',{name:/Nivel 1/}).click()
      await check('Trivia offline')
      await context.setOffline(false)
    }
    assert.deepEqual(errores,[])
    informe.push({width,modo:dev?'DEV':'producción',errores:0,desborde:false})
    await context.close()
  }
  writeFileSync(`qa/ricotero-${dev?'dev':'produccion'}.json`,JSON.stringify(informe,null,2))
  console.log(JSON.stringify(informe))
} finally {await browser?.close();servidor.kill()}
