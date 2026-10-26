import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const url = 'http://127.0.0.1:4174'
const servidor = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { windowsHide: true, stdio: 'ignore' })
let browser
const informe = []
try {
  for (let n=0;n<60;n++) { try { if ((await fetch(url)).ok) break } catch {} await new Promise((r)=>setTimeout(r,250)) }
  browser = await chromium.launch({ headless: true })
  for (const [width,height] of [[360,640],[390,844],[1280,720],[1024,600]]) {
    const contexto = await browser.newContext({ viewport: {width,height}, reducedMotion: 'reduce' })
    await contexto.addInitScript(() => {
      window.__musicaQA = { pausa:0, play:0, next:0, stop:0, destroy:0 }
      window.YT = { PlayerState: { PLAYING:1, ENDED:0 }, Player: class {
        constructor(destino, opciones) { this.estado=1; this.opciones=opciones; this.iframe=document.createElement('iframe'); this.iframe.width=200; this.iframe.height=200; destino.append(this.iframe); queueMicrotask(()=>opciones.events.onReady({target:this})) }
        getPlaylist(){return ['uno','dos','tres']}
        loadPlaylist(){this.playVideo()}
        getPlayerState(){return this.estado}
        pauseVideo(){this.estado=2;window.__musicaQA.pausa++}
        playVideo(){this.estado=1;window.__musicaQA.play++}
        nextVideo(){window.__musicaQA.next++}
        stopVideo(){window.__musicaQA.stop++}
        destroy(){window.__musicaQA.destroy++;this.iframe.remove()}
        mute(){} unMute(){} setVolume(){} setShuffle(){} setLoop(){}
      } }
    })
    const page = await contexto.newPage(), errores = []
    page.on('pageerror', (e) => errores.push(e.message))
    await page.goto(url)
    let pantallas = 0
    const verificar = async (nombre) => {
      await page.locator('main').waitFor()
      const resultado = await page.evaluate(() => {
        const musica=document.querySelector('.musica'), r=musica.getBoundingClientRect(), v=document.querySelector('.musica-video').getBoundingClientRect()
        const visible = (e) => {
          const b=e.getBoundingClientRect(), caja={left:b.left,right:b.right,top:b.top,bottom:b.bottom}
          for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){
            const estilo=getComputedStyle(p), limite=p.getBoundingClientRect()
            if(/auto|scroll|hidden|clip/.test(estilo.overflowX)){caja.left=Math.max(caja.left,limite.left);caja.right=Math.min(caja.right,limite.right)}
            if(/auto|scroll|hidden|clip/.test(estilo.overflowY)){caja.top=Math.max(caja.top,limite.top);caja.bottom=Math.min(caja.bottom,limite.bottom)}
          }
          return caja
        }
        const choque=[...document.querySelectorAll('button,input,select,summary')].filter((e)=>!musica.contains(e)&&e.checkVisibility({visibilityProperty:true})).filter((e)=>{const b=visible(e);return b.right>b.left&&b.bottom>b.top&&Math.min(b.right,r.right)>Math.max(b.left,r.left)+1&&Math.min(b.bottom,r.bottom)>Math.max(b.top,r.top)+1}).map((e)=>e.getAttribute('aria-label')||e.textContent.trim())
        return { choque, ancho:v.width,alto:v.height,flujo:getComputedStyle(musica).position,desborde:document.documentElement.scrollWidth>innerWidth }
      })
      assert.deepEqual(resultado.choque,[],`${width} ${nombre}: controles tapados`)
      assert.ok(resultado.ancho>=200&&resultado.alto>=200)
      assert.equal(resultado.desborde,false,`${width} ${nombre}: desborde`)
      if(width<=700) assert.equal(resultado.flujo,'static')
      pantallas++
    }
    await verificar('perfiles')
    await page.getByLabel('Crear perfil',{exact:true}).fill('QA Jugador')
    await page.getByRole('button',{name:'Crear y jugar'}).click()
    await verificar('tutorial')
    await page.getByRole('button',{name:'Saltar',exact:true}).click()
    await verificar('selección jugador')
    await page.getByRole('button',{name:/Un jugador/}).click()
    await verificar('menú')
    await page.getByRole('button',{name:'Pausar o reanudar música'}).click()
    await page.getByRole('button',{name:'Pausar o reanudar música'}).click()
    await page.getByRole('button',{name:'Siguiente canción',exact:true}).click()
    assert.ok(await page.evaluate(()=>window.__musicaQA.pausa>0&&window.__musicaQA.next>0))
    for (const modo of ['Dicho de otra forma','Reto del día','La banda','Sopa de letras','Trivia','Crucigrama','Discografía','Adivinanzas por palabras']) {
      await page.getByRole('navigation',{name:'Modos de juego'}).getByRole('button',{name:new RegExp(modo==='Dicho de otra forma'?modo:'^'+modo)}).click()
      await verificar(modo)
      if(modo==='Trivia'||modo==='La banda') { await page.getByRole('button',{name:/Nivel 1/}).click();await verificar(modo+' partida') }
      if(modo==='Dicho de otra forma') {
        for(let n=0;n<4;n++) {
          await page.getByRole('group',{name:'Categoría',exact:true}).getByRole('button').nth(n).click()
          await verificar('Dicho categoría '+n)
          await page.getByRole('button',{name:'Volver',exact:true}).click()
        }
      }
      await page.getByRole('button',{name:'Ir al menú principal'}).click()
    }
    await page.getByRole('button',{name:/^Logros/}).click();await verificar('logros')
    await page.getByRole('button',{name:'Ir al menú principal'}).click()
    for (const nombre of ['Aviso legal','Privacidad','Contacto']) {
      await page.getByRole('navigation',{name:'Información legal'}).getByRole('button',{name:nombre,exact:true}).click()
      await verificar(nombre)
    }
    await page.screenshot({path:`qa/revision-${width}.png`,fullPage:true,animations:'disabled'})
    await page.getByRole('button',{name:'Cerrar reproductor'}).click()
    assert.equal(await page.locator('.musica').count(),0)
    assert.ok(await page.evaluate(()=>window.__musicaQA.stop>0&&window.__musicaQA.destroy>0))
    assert.deepEqual(errores,[])
    informe.push({width,height,pantallas,solapamientos:0,apiMusica:'pausa/reanuda/siguiente/cierre OK'})
    await contexto.close()
  }
  writeFileSync('qa/interfaz.json',JSON.stringify(informe,null,2)+'\n')
  console.log(informe)
} finally { await browser?.close();servidor.kill() }
