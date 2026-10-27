import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { contraste, textoSobre } from '../src/contraste.js'

const memoria = new Map([['ricota_quiz', JSON.stringify({ v: 6, activo: 'qa', preferencias: { apariencia: 'claro', volumen: 40 }, perfiles: [{ id: 'qa', alias: 'Jugador QA', progreso: { nivel: 4, partidas: 8 } }], pendiente: null })]])
globalThis.localStorage = { getItem: (k) => memoria.get(k) ?? null, setItem: (k, v) => memoria.set(k, v) }
const s = await import('../src/storage.js')
assert.equal(s.leer().nivel, 4)
s.guardar({})
const migrado = JSON.parse(memoria.get('ricota_quiz'))
assert.equal(migrado.v, 10)
assert.equal(migrado.preferencias.volumen, 40)
assert.ok(!('apariencia' in migrado.preferencias))
const { registrarVista, planPara } = await import('../src/historial.js')
for (let n = 0; n < 200; n++) registrarVista('trivia', [`q:${n}`])
assert.equal(s.leer().historial.trivia.vistos.length, 150)
assert.equal(s.leer().historial.trivia.partidas.length, 3)
const { nuevaSemilla } = await import('../src/azar.js')
assert.equal(new Set(Array.from({ length: 1000 }, nuevaSemilla)).size, 1000)
const { armarCasillas, nuevaRonda } = await import('../src/adivinanza.js')
const { prepararLetras } = await import('../src/letrasIniciales.js')
for (const [titulo, esperadas] of [['Alfa', 0], ['Alfa beta gama delta', 1], ['Alfa beta gama delta epsilon zeta', 2], ['Abecedariolarguisimodeprueba', 2]]) {
  for (const dif of ['casual', 'fanatico']) {
    const g = armarCasillas(titulo), ayuda = prepararLetras(g, dif, 'semillaqa')
    assert.ok(ayuda.fijas.filter(Boolean).length >= Math.min(g.flatMap(x=>x.letras).length, dif === 'casual' ? 2 : 1))
    assert.deepEqual(ayuda, prepararLetras(g, dif, 'semillaqa'))
    assert.ok(!ayuda.fijas[ayuda.foco])
  }
}
const { armarNivel, armarNivelBanda } = await import('../src/trivia.js')
const { nuevaPartida } = await import('../src/sopa.js')
const { nuevoCrucigrama } = await import('../src/crucigrama.js')
const { crearLink, leerDesafio } = await import('../src/desafio.js')
const plan = planPara('trivia')
for (const modo of ['trivia', 'banda', 'sopa', 'crucigrama', 'adivinanzas']) {
  const d = { modo, nivel: 1, tema: 'todos', disco: 'todos', ronda: 'dichocanciones', dif: 'casual', semilla: nuevaSemilla(), puntaje: 1, version: 3, plan }
  const url = crearLink({ ...d, alias: 'NO-DEBE-VIAJAR' })
  assert.ok(!url.includes('NO-DEBE-VIAJAR'))
  const recibido = leerDesafio(new URL(url).hash)
  assert.equal(recibido.version, 3)
  const generar = (d) => modo === 'trivia' ? armarNivel(1, d.semilla, 'todos', 3, d.plan) : modo === 'banda' ? armarNivelBanda(1, d.semilla, 3, d.plan) : modo === 'sopa' ? nuevaPartida('todos', d.semilla, 'todos', d.plan) : modo === 'crucigrama' ? nuevoCrucigrama('todos', 'casual', d.semilla, 'todos', d.plan) : nuevaRonda({ modo: 'dicho', semilla: d.semilla, plan: d.plan })
  assert.deepEqual(generar(d), generar(recibido))
}
assert.equal(leerDesafio('#/desafio/trivia/99/casual/abcd1234/6').version, 1)
const catalogo = JSON.parse(readFileSync('src/data/adivinanzas.json', 'utf8')).filter((a) => !a.descartada)
assert.equal(catalogo.filter((a) => a.tipo === 'cancion').length, 44)
assert.equal(new Set(catalogo.filter((a) => a.tipo === 'cancion').map((a) => a.respuesta)).size, 44)
for (let i = 0; i < 50; i++) {
  const r = nuevaRonda({ modo: 'dicho', semilla: `legado${i}` })
  assert.ok(catalogo.some((a) => a.id === r.acertijoId), 'Un enlace antiguo usó una alusión descartada')
}
const js = readdirSync('dist/assets').filter((f) => f.endsWith('.js')).map((f) => readFileSync('dist/assets/' + f, 'utf8')).join('\n')
for (const ruta of ['letras_privadas', 'letras-privadas', 'datos-pendientes', 'C:\\Users', 'D:\\proyectos']) assert.ok(!js.includes(ruta), 'Ruta privada en bundle')
for (const i of JSON.parse(readFileSync('src/data/interpretaciones.json', 'utf8')).filter((i) => !i.verificada || !i.fuente?.url)) assert.ok(!js.includes(i.resumen), 'Interpretación sin verificar en bundle')
for (const archivo of readdirSync('src/data').filter((f) => f.endsWith('.json'))) {
  const revisar = (x) => { if (!x || typeof x !== 'object') return; for (const [k,v] of Object.entries(x)) { assert.ok(!/^(letra|letras|lyrics|versos)$/i.test(k), `Campo prohibido en ${archivo}`); revisar(v) } }
  revisar(JSON.parse(readFileSync('src/data/' + archivo, 'utf8')))
}
const coloresSopa = ['#e0a526','#c0392b','#3aa17e','#5b8def','#b455d6','#e0742b','#2bb7c9','#d6567f','#8fb339','#9a8cff']
const ratios = [...coloresSopa.map((c) => contraste(c,textoSobre(c))), contraste('#ffffff','#c63f28'), contraste('#ece8de','#161617'), contraste('#e2dbcc','#861a36'), contraste('#9ff0dc','#163b36')]
assert.ok(Math.min(...ratios) >= 4.5)
console.log(`Contraste mínimo de paleta/textos verificados: ${Math.min(...ratios).toFixed(2)}:1`)
console.log('QA rápida aprobada: migración v6→v10, 150 vistos/3 rondas, semillas, letras iniciales, replay de cinco modos, catálogo y bundle público.')
