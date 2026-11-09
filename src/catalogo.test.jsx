import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import datos from './data/datos-ricotero.json'
import acertijos from './data/adivinanzas.json'
import { catalogoIconicas, generarFrases } from './catalogoFrases.js'
import { validarFrases } from './frases.js'
import { cancionesConPalabras, nuevaRonda } from './adivinanza.js'
import { palabrasDisponibles } from './sopa.js'
import { candidatas } from './crucigrama.js'
import { armarNivel } from './trivia.js'
import Discografia from './Discografia.jsx'
import { idTexto } from './identidad.js'

afterEach(cleanup)
const nuevas = [
  ['Semen-Up', 'oktubre'], ['Rock para los dientes', 'bang'],
  ['Maldición, va a ser un día hermoso', 'bang'], ['Yo no me caí del cielo', 'gulp'],
  ['Superlógico', 'gulp'], ['Ñam fi frufi fali fru', 'gulp'],
  ['Sorpresa de Shangai', 'lobo'], ['Susanita', 'lobo'],
  ['Rock para el negro Atila', 'lobo'], ['Luzbelito y las sirenas', 'luzbelito'],
]
const retiradas = ['Alien duce', 'Las increíbles andanzas del Capitán Buscapina en Cybersiberia', 'Morta punto com']

it.each(nuevas)('integra %s en su disco y en todos los bancos jugables', (titulo, disco) => {
  const c = datos.canciones.find(c => c.titulo === titulo)
  expect(c).toMatchObject({ disco, disco_verificado: true, palabras_verificadas: true })
  expect(c.palabras.length).toBeGreaterThanOrEqual(8)
  expect(c.palabras.every(p => c.definiciones[p]?.length > 10)).toBe(true)
  expect(cancionesConPalabras).toContain(c)
  expect(acertijos.some(a => a.respuesta === titulo && !a.descartada)).toBe(true)
  expect(palabrasDisponibles(disco).some(p => p.cancion === titulo)).toBe(true)
  expect(candidatas(disco).some(p => p.pista.startsWith(`${titulo}:`))).toBe(true)
  const frases = catalogoIconicas.filter(f => f.cancion === titulo)
  expect(validarFrases(frases, { variantes: true }).length).toBeGreaterThan(0)
  expect(frases.every(f => f.album === datos.discos.find(d => d.id === disco).titulo)).toBe(true)
  const plan = { ciclo: datos.canciones.filter(c => c.titulo !== titulo).map(c => idTexto('r', `canciones:${c.titulo}`)) }
  for (const modo of ['dicho', 'palabras']) for (const dif of ['casual', 'fanatico']) {
    expect(nuevaRonda({ modo, dif, semilla: 'catalogo', plan }).respuesta).toBe(titulo)
  }
})

it('excluye los retiros del catálogo, pistas y rondas actuales de ambas dificultades', () => {
  expect(datos.canciones).toHaveLength(51)
  expect(new Set(datos.canciones.map(c => c.titulo)).size).toBe(51)
  for (const titulo of retiradas) {
    expect(acertijos.some(a => a.respuesta === titulo)).toBe(false)
    expect(catalogoIconicas.some(f => f.cancion === titulo)).toBe(false)
    expect(palabrasDisponibles('todos').some(p => p.cancion === titulo)).toBe(false)
  }
  for (const dif of ['casual', 'fanatico']) for (let i = 0; i < 150; i++) {
    const semilla = `catalogo${i}`
    for (const modo of ['dicho', 'palabras']) {
      const r = nuevaRonda({ modo, dif, semilla })
      expect(retiradas).not.toContain(r.respuesta)
    }
    const frases = generarFrases(semilla, dif)
    expect(frases).toHaveLength(10)
    expect(frases.every(f => !retiradas.includes(f.cancion))).toBe(true)
    const trivia = armarNivel(2, semilla, 'todos', 3, undefined, dif)
    expect(trivia).toHaveLength(10)
    for (const p of trivia) expect(p.opciones.some(o => retiradas.includes(o))).toBe(false)
  }
})

it('muestra el catálogo y permite buscar frases nuevas con sus fuentes', () => {
  render(<Discografia onVolver={() => {}} onMenu={() => {}} />)
  for (const [titulo] of nuevas) expect(screen.getByText(titulo)).toBeTruthy()
  for (const titulo of retiradas) expect(screen.queryByText(titulo)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Frases', exact: true }))
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Superlógico' } })
  expect(screen.getByText('Superlógico')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ver fuente' }).getAttribute('href')).toContain('/gulp/superlogico/')
  expect(screen.queryByText(/Atribución por revisar/)).toBeNull()
})
