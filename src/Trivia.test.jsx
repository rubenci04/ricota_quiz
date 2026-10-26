import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import Trivia from './Trivia.jsx'
import { armarNivel } from './trivia.js'
import { crearPerfil, guardar, leer } from './storage.js'

vi.mock('./sonido.js', () => ({ sonar: vi.fn() }))
vi.mock('./azar.js', async (original) => ({ ...await original(), nuevaSemilla: () => 'abcd1234' }))

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  crearPerfil(`Pogo ${crypto.randomUUID().slice(0, 8)}`)
})
afterEach(cleanup)

function completar(ronda) {
  ronda.forEach((p, i) => {
    expect(screen.getByText(`${i + 1}/10`)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: p.opciones[p.correcta], exact: true }))
    fireEvent.click(screen.getByRole('button', { name: i < 9 ? /Siguiente/ : /Terminar/ }))
  })
}

it('muestra bloqueos, termina exactamente en diez y habilita repetir sin un nivel seis', () => {
  guardar({ nivel: 5 })
  render(<Trivia onVolver={() => {}} />)
  fireEvent.click(screen.getByRole('button', { name: /Nivel 5/ }))
  completar(armarNivel(5, 'abcd1234', 'todos', 3, { vistos: [], recientes: [], ciclo: [] }))
  expect(screen.getByText('10/10', { selector: '.resultado-puntaje' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Nivel 6' })).toBeNull()
  expect(leer()).toMatchObject({ nivel: 5, partidas: 1, niveles: { trivia: { 5: { mejor: 10, intentos: 1 } } } })
  fireEvent.click(screen.getByRole('button', { name: 'Repetir nivel' }))
  expect(screen.getByText('1/10')).toBeTruthy()
  expect(leer().niveles.trivia[5].intentos).toBe(2)
})

it('los desafíos antiguos cuentan partidas pero no desbloquean niveles ni alteran récords', () => {
  render(<Trivia onVolver={() => {}} desafio={{ nivel: 9, tema: 'todos', semilla: 'abcd1234', puntaje: 8, dif: 'casual', version: 1 }} />)
  completar(armarNivel(9, 'abcd1234'))
  expect(leer()).toMatchObject({ nivel: 1, mejor: 0, partidas: 1, niveles: { trivia: {} } })
  expect(screen.getByText('Desafío terminado. No cambia tus niveles.')).toBeTruthy()
})

it('los niveles futuros están deshabilitados y se desbloquea el siguiente al aprobar', () => {
  render(<Trivia onVolver={() => {}} />)
  expect(screen.getByRole('button', { name: /Nivel 2/ }).disabled).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: /Nivel 1/ }))
  completar(armarNivel(1, 'abcd1234', 'todos', 3, { vistos: [], recientes: [], ciclo: [] }))
  fireEvent.click(screen.getByRole('button', { name: 'Elegir nivel' }))
  expect(screen.getByRole('button', { name: /Nivel 2/ }).disabled).toBe(false)
})
