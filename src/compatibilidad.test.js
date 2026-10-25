import { expect, it } from 'vitest'
import { nuevaPartida } from './sopa.js'
import { nuevoCrucigrama } from './crucigrama.js'
import { nuevaRonda } from './adivinanza.js'
import { retoDe } from './reto.js'
import { crearLink, leerDesafio } from './desafio.js'

it('conserva semillas en sopa, crucigrama, adivinanzas y dicho', () => {
  const sopa = nuevaPartida('todos', 'abcd1234')
  expect(sopa).toBeTruthy()
  expect(nuevaPartida('todos', 'abcd1234')).toEqual(sopa)
  const cruci = nuevoCrucigrama('todos', 'casual', 'abcd1234')
  expect(cruci?.entradas.length).toBeGreaterThan(0)
  expect(nuevoCrucigrama('todos', 'casual', 'abcd1234')).toEqual(cruci)
  for (const modo of ['palabras', 'dicho']) {
    const args = { modo, categoria: 'canciones', semilla: 'abcd1234' }
    expect(nuevaRonda(args)).toBeTruthy()
    expect(nuevaRonda(args)).toEqual(nuevaRonda(args))
  }
  expect(retoDe('2026-10-25')).toEqual(retoDe('2026-10-25'))
})

it.each(['sopa', 'crucigrama', 'adivinanzas'])('mantiene el formato de desafíos de %s', (modo) => {
  const d = { modo, disco: 'todos', tema: 'todos', ronda: 'palabras', dif: 'casual', semilla: 'abcd1234', puntaje: 1 }
  expect(leerDesafio(new URL(crearLink(d)).hash)).toMatchObject({ modo, disco: 'todos', tema: 'todos', semilla: d.semilla })
})
