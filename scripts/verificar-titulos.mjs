// Simula partidas de cada modo, dificultad y nivel y comprueba las reglas de dificultad por largo de título.
// Uso: node scripts/ejecutar.mjs scripts/verificar-titulos.mjs
import datos from '../src/data/datos-ricotero.json'
import { armarNivel, armarNivelBanda } from '../src/trivia.js'
import { nuevaRonda } from '../src/adivinanza.js'
import { nuevaPartida } from '../src/sopa.js'
import { nuevoCrucigrama, celdasIniciales } from '../src/crucigrama.js'
import { catalogo, retoDe } from '../src/reto.js'
import { nivelTitulo, techoTitulo } from '../src/dificultad.js'
import { nuevaSemilla } from '../src/azar.js'

const nivelDe = new Map(datos.canciones.map((c) => [c.titulo, nivelTitulo(c.titulo)]))
const fallos = []
const filas = []
const comprobar = (ok, msg) => { if (!ok) fallos.push(msg) }
const plan = (nj) => ({ vistos: [], recientes: [], ciclo: [], nj })
const N = 120

for (const dif of ['casual', 'fanatico']) {
  for (const nj of [1, 2, 3, 4, 5]) {
    const techo = techoTitulo(dif, nj)
    const vistos = { trivia: [0, 0, 0, 0], banda: [0, 0, 0, 0], dicho: [0, 0, 0, 0], palabras: [0, 0, 0, 0] }
    let masDeUnNivel4 = 0
    for (let i = 0; i < N; i++) {
      const semilla = nuevaSemilla()
      for (const [modo, partida] of [['trivia', armarNivel(nj, semilla, 'todos', 3, plan(nj), dif)], ['banda', armarNivelBanda(Math.min(nj, 4), semilla, 3, plan(nj), dif)]]) {
        let n4 = 0
        for (const p of partida) {
          const usados = new Set([...(p.cancion ? [p.cancion] : []), ...p.opciones.filter((o) => nivelDe.has(o))])
          if (p.pistas) comprobar(p.pistas.length >= 5 && p.pistas.length <= 6 || p.pistas.length === datos.canciones.find((c) => c.titulo === p.cancion).palabras.length, `${modo}: pistas ${p.pistas.length}`)
          for (const t of usados) vistos[modo][nivelDe.get(t) - 1]++
          for (const t of usados) comprobar(nivelDe.get(t) <= techo, `${modo} ${dif} nj${nj}: «${t}» nivel ${nivelDe.get(t)} > ${techo}`)
          if (nivelDe.get(p.cancion) === 4) n4++
          if (p.cancion) comprobar(!p.opciones.some((o) => nivelDe.get(o) === 4 && o !== p.opciones[p.correcta]), 'distractor de nivel 4')
        }
        if (n4 > 1) masDeUnNivel4++
        comprobar(n4 <= 1, `${modo} ${dif} nj${nj}: ${n4} títulos de nivel 4 en una partida`)
      }
      for (const [modo, args] of [['dicho', { modo: 'dicho', categoria: 'canciones' }], ['palabras', { modo: 'palabras', categoria: 'canciones' }]]) {
        const r = nuevaRonda({ ...args, dif, semilla, plan: plan(nj) })
        const nivel = nivelDe.get(r.respuesta)
        vistos[modo][nivel - 1]++
        comprobar(nivel <= techo, `${modo} ${dif} nj${nj}: «${r.respuesta}» nivel ${nivel} > ${techo}`)
        if (modo === 'palabras') {
          const titulo = r.respuesta.toLowerCase()
          const sinTitulo = r.palabras.filter((w) => !titulo.split(/\s+/).includes(w.toLowerCase()))
          const visibles = r.palabras.slice(0, dif === 'casual' ? 6 : 5)
          comprobar(visibles.length === Math.min(dif === 'casual' ? 6 : 5, r.palabras.length), 'palabras visibles')
          comprobar(visibles.every((w) => sinTitulo.includes(w)) || sinTitulo.length < visibles.length, 'palabra del título entre las visibles')
        }
      }
    }
    filas.push({ dif, nj, techo, 'trivia N1/N2/N3/N4': vistos.trivia.join('/'), 'banda': vistos.banda.join('/'), 'dicho': vistos.dicho.join('/'), 'palabras': vistos.palabras.join('/') })
  }
}

// Reto del día: 3 años de fechas, con racha corta y larga
const racha = { corta: [0, 1, 2], larga: [3, 10] }
const retoNiveles = { corta: [0, 0, 0, 0], larga: [0, 0, 0, 0] }
for (let d = 0; d < 1100; d++) {
  const fecha = new Date(Date.UTC(2026, 0, 1) + d * 86400000).toISOString().slice(0, 10)
  for (const [k, lista] of Object.entries(racha)) for (const r of lista) {
    const nivel = nivelDe.get(retoDe(fecha, r).cancion.titulo)
    retoNiveles[k][nivel - 1]++
    comprobar(nivel <= 3, `reto ${fecha}: nivel ${nivel}`)
    if (r < 3) comprobar(nivel <= 2, `reto ${fecha} racha ${r}: nivel ${nivel} > 2`)
  }
}

// Sopa y crucigrama: palabras cortas al comienzo, largas solo en niveles altos
const largos = []
for (const [dif, nj] of [['casual', 1], ['casual', 2], ['casual', 5], ['fanatico', 1], ['fanatico', 3], ['fanatico', 5]]) {
  let sopa = [], cruci = [], sinIniciales = 0, conIniciales = 0
  for (let i = 0; i < 40; i++) {
    const semilla = nuevaSemilla()
    sopa.push(...nuevaPartida('todos', semilla, 'todos', plan(nj), dif).palabras.map((p) => p.norm.length))
    const c = nuevoCrucigrama('todos', dif, semilla, 'todos', plan(nj))
    comprobar(c, `crucigrama nulo ${dif} nj${nj}`)
    cruci.push(...c.entradas.map((e) => e.respuesta.length))
    const ini = celdasIniciales(c, dif, semilla)
    for (const e of c.entradas) {
      const [dr, dc] = e.dir === 'across' ? [0, 1] : [1, 0]
      const celdas = Array.from({ length: e.respuesta.length }, (_, k) => `${e.r + dr * k},${e.c + dc * k}`)
      const cuenta = celdas.filter((k) => k in ini).length
      const minimo = dif === 'casual' && e.respuesta.length >= 7 ? 2 : 1
      cuenta >= minimo ? conIniciales++ : sinIniciales++
    }
  }
  const pct = (a, f) => Math.round((100 * a.filter(f).length) / a.length)
  comprobar(sinIniciales === 0, `crucigrama ${dif} nj${nj}: ${sinIniciales} palabras sin letras iniciales suficientes`)
  largos.push({ dif, nj, 'sopa 5-7 %': pct(sopa, (n) => n >= 5 && n <= 7), 'sopa >9 %': pct(sopa, (n) => n > 9), 'cruci <=8 %': pct(cruci, (n) => n <= 8), 'cruci >=9 %': pct(cruci, (n) => n >= 9), 'palabras sin iniciales': sinIniciales })
  if (nj === 1) comprobar(pct(sopa, (n) => n >= 5 && n <= (dif === 'casual' ? 7 : 8)) >= 85, `sopa ${dif} nj1: pocas palabras cortas`)
  if (dif === 'casual' && nj < 5) comprobar(pct(cruci, (n) => n <= 8) >= 85, `crucigrama casual nj${nj}: demasiadas largas`)
}

console.log('Títulos usados por nivel (1/2/3/4) según dificultad y nivel de juego (' + N + ' partidas c/u)')
console.table(filas)
console.log('Reto del día (3 años de fechas): niveles 1/2/3/4 con racha corta', retoNiveles.corta.join('/'), '· racha larga', retoNiveles.larga.join('/'))
console.log('Catálogo del reto:', catalogo.length, 'canciones, niveles', [1, 2, 3, 4].map((n) => catalogo.filter((c) => nivelDe.get(c.titulo) === n).length).join('/'))
console.table(largos)
console.log(fallos.length ? `FALLAS (${fallos.length}):\n` + [...new Set(fallos)].slice(0, 25).join('\n') : 'TODAS LAS REGLAS SE CUMPLEN')
process.exitCode = fallos.length ? 1 : 0
