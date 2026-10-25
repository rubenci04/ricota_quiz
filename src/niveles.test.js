import { beforeEach, expect, it, vi } from 'vitest'

let s, n
beforeEach(async () => {
  localStorage.clear(); vi.resetModules()
  s = await import('./storage.js'); n = await import('./niveles.js')
  s.crearPerfil('Pogo Azul')
})

it('cuenta intentos iniciados, exige seis aciertos y conserva el mejor al repetir', () => {
  expect(() => n.iniciarNivel('trivia', 2)).toThrow('bloqueado')
  n.iniciarNivel('trivia', 1); n.terminarNivel('trivia', 1, 5)
  expect(s.leer().nivel).toBe(1)
  n.iniciarNivel('trivia', 1); n.terminarNivel('trivia', 1, 8)
  expect(s.leer().nivel).toBe(2)
  n.iniciarNivel('trivia', 1); n.terminarNivel('trivia', 1, 3)
  n.iniciarNivel('trivia', 1) // intento abandonado también cuenta
  expect(s.leer().niveles.trivia[1]).toEqual({ intentos: 4, mejor: 8 })
  expect(s.leer().nivelBanda).toBe(1)
})

it.each(['trivia', 'banda'])('acota %s y permite repetir la última etapa', async (modo) => {
  const { revisarLogros } = await import('./logros.js')
  for (let i = 1; i <= n.LIMITES[modo]; i++) {
    n.iniciarNivel(modo, i); n.terminarNivel(modo, i, 6)
  }
  n.iniciarNivel(modo, n.LIMITES[modo]); n.terminarNivel(modo, n.LIMITES[modo], 10)
  expect(n.maximoAlcanzado(s.leer(), modo)).toBe(n.LIMITES[modo])
  expect(() => n.iniciarNivel(modo, n.LIMITES[modo] + 1)).toThrow()
  revisarLogros()
  expect(s.leer().logros[modo === 'trivia' ? 'trivia5' : 'banda3']).toBeTruthy()
})
