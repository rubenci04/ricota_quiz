import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { armarNivel, armarNivelBanda, clavePregunta, triviaTieneTema } from './trivia.js'
import { crearLink, leerDesafio } from './desafio.js'
import { TEMAS } from './temas.js'
import huellas from './desafios-v1.fixture.json'

describe('rondas nuevas', () => {
  it('genera diez preguntas únicas con cuatro opciones distintas en todos los niveles y temas', () => {
    for (let s = 0; s < 100; s++) {
      for (const tema of ['todos', ...TEMAS.map((t) => t.id)].filter(triviaTieneTema)) {
        for (let n = 1; n <= 5; n++) verificar(armarNivel(n, `ronda${s}`, tema, 2))
      }
      for (let n = 1; n <= 4; n++) verificar(armarNivelBanda(n, `ronda${s}`, 2))
    }
  }, 30000)

  it('mantiene las rondas reproducibles y los links libres de alias', () => {
    for (const modo of ['trivia', 'banda']) {
      const d = { modo, nivel: 3, tema: 'todos', version: 2, dif: 'casual', semilla: 'abcd1234', puntaje: 8, alias: 'Secreto' }
      const link = crearLink(d)
      expect(link).not.toContain('Secreto')
      const recibido = leerDesafio(new URL(link).hash)
      expect(recibido).toMatchObject({ version: 2, nivel: 3, semilla: d.semilla })
      const ronda = (x) => modo === 'banda' ? armarNivelBanda(x.nivel, x.semilla, x.version) : armarNivel(x.nivel, x.semilla, x.tema, x.version)
      expect(ronda(d)).toEqual(ronda(recibido))
    }
  })
})

describe('desafíos existentes', () => {
  it.each(huellas)('conserva exactamente la ronda original $modo nivel $nivel tema $tema', (d) => {
    // Huellas obtenidas del generador de main b1a382a, antes de los cambios.
    const recibido = leerDesafio(`#/desafio/${d.modo}/${d.nivel}.${d.tema}/casual/${d.semilla}/8`)
    expect(recibido.version).toBe(1)
    const ronda = d.modo === 'banda' ? armarNivelBanda(d.nivel, d.semilla, recibido.version) : armarNivel(d.nivel, d.semilla, d.tema, recibido.version)
    expect(createHash('sha256').update(JSON.stringify(ronda)).digest('hex')).toBe(d.hash)
  })

  it('acepta links sin tema y rechaza versiones o niveles nuevos inválidos', () => {
    expect(leerDesafio('#/desafio/trivia/99/casual/abcd1234/6')).toMatchObject({ nivel: 99, tema: 'todos', version: 1 })
    for (const segmento of ['6.todos.v2', '1.todos.v3', '0', '1.todos.v2.extra']) {
      expect(leerDesafio(`#/desafio/trivia/${segmento}/casual/abcd1234/6`)).toBeNull()
    }
  })
})

function verificar(ronda) {
  expect(ronda).toHaveLength(10)
  expect(new Set(ronda.map(clavePregunta)).size).toBe(10)
  for (const p of ronda) {
    expect(new Set(p.opciones).size).toBe(4)
    expect(p.correcta).toBeGreaterThanOrEqual(0)
    expect(p.correcta).toBeLessThan(4)
  }
}
