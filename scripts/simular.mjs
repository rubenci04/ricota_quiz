import { writeFileSync } from 'node:fs'
import { armarNivel, armarNivelBanda } from '../src/trivia.js'
import { nuevaPartida } from '../src/sopa.js'
import { nuevoCrucigrama } from '../src/crucigrama.js'
import { nuevaRonda } from '../src/adivinanza.js'
import datos from '../src/data/datos-ricotero.json'
import { nuevaSemilla } from '../src/azar.js'
import { idPregunta, idTexto } from '../src/identidad.js'

const despues = process.argv.includes('--despues')
const resultados = {}
for (const modo of ['trivia', 'banda', 'sopa', 'crucigrama', 'palabras', 'dichocanciones', 'dichodiscos', 'dichopalabras', 'dichointegrantes']) {
  let historial = [], partidas = [], ciclo = [], repetidas = 0, elementos = 0, cancionesRepetidas = 0, cancionesTotal = 0, duplicadas = 0
  const canciones = Object.fromEntries(datos.canciones.map((c) => [c.titulo, 0]))
  for (let i = 0; i < 200; i++) {
    const plan = despues ? { vistos: historial, recientes: [...new Set(partidas.slice(-3).flat())], ciclo } : undefined
    const semilla = nuevaSemilla()
    let ids = [], extras = [], titulos = []
    if (modo === 'trivia' || modo === 'banda') {
      const r = modo === 'trivia' ? armarNivel(1 + i % 5, semilla, 'todos', plan ? 3 : 2, plan) : armarNivelBanda(1 + i % 4, semilla, plan ? 3 : 2, plan)
      ids = r.map(idPregunta)
      titulos = r.flatMap((p) => p.cancion ? [p.cancion] : p.pistas ? [p.opciones[p.correcta]] : datos.canciones.filter((c) => p.texto.includes(c.titulo)).map((c) => c.titulo))
    } else if (modo === 'sopa') {
      const r = nuevaPartida('todos', semilla, 'todos', plan)
      ids = r.palabras.map((p) => idTexto('w', p.norm)); titulos = r.palabras.map((p) => p.cancion)
    } else if (modo === 'crucigrama') {
      const r = nuevoCrucigrama('todos', 'casual', semilla, 'todos', plan)
      if (!r) throw new Error('Crucigrama vacío')
      ids = r.entradas.map((p) => idTexto('w', p.respuesta))
      titulos = r.entradas.flatMap((p) => p.cancion ? [p.cancion] : datos.canciones.filter((c) => p.pista.startsWith(c.titulo + ':')).map((c) => c.titulo))
    } else {
      const r = nuevaRonda({ modo: modo === 'palabras' ? 'palabras' : 'dicho', categoria: modo === 'palabras' ? 'canciones' : modo.slice(5), semilla, plan })
      ids = [idTexto('r', `${r.categoria}:${r.id}`)]
      extras = r.acertijoId ? [`a:${r.acertijoId}`] : []
      titulos = r.cancion ? [r.cancion.titulo] : []
    }
    const recientes = new Set(partidas.slice(-3).flat())
    repetidas += ids.filter((id) => recientes.has(id)).length; elementos += ids.length
    duplicadas += titulos.length - new Set(titulos).size
    titulos = [...new Set(titulos)]
    for (const t of titulos) canciones[t]++
    const idsCanciones = titulos.map((t) => `c:${datos.canciones.findIndex((c) => c.titulo === t)}`)
    cancionesTotal += idsCanciones.length
    cancionesRepetidas += idsCanciones.filter((id) => recientes.has(id)).length
    partidas.push([...new Set([...ids, ...extras, ...idsCanciones])])
    historial = [...historial, ...partidas.at(-1)].slice(-150)
    const respuesta = ids.find((id) => id.startsWith('r:'))
    if (respuesta) ciclo = [...(ciclo.includes(respuesta) ? [] : ciclo), respuesta]
  }
  const total = Object.values(canciones).reduce((a,b) => a+b,0), promedio = total / 44
  resultados[modo] = { partidas: 200, repeticion3: +(100*repetidas/elementos).toFixed(2), repeticionCanciones3: cancionesTotal ? +(100*cancionesRepetidas/cancionesTotal).toFixed(2) : 0, duplicadas, promedio: +promedio.toFixed(2), concentradas: Object.entries(canciones).filter(([,n]) => n > 2*promedio).map(([t,n])=>({ cancion:t, veces:n })), canciones }
}
writeFileSync(`qa/azar-${despues ? 'despues' : 'antes'}.json`, JSON.stringify(resultados,null,2)+'\n')
console.log(Object.fromEntries(Object.entries(resultados).map(([m,r])=>[m,{ repeticion3:r.repeticion3, canciones3:r.repeticionCanciones3, duplicadas:r.duplicadas, concentradas:r.concentradas.length }])))
