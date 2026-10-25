import { beforeEach, describe, expect, it, vi } from 'vitest'

let s
beforeEach(async () => {
  localStorage.clear()
  vi.resetModules()
  s = await import('./storage.js')
})

describe('perfiles locales', () => {
  it('normaliza alias y rechaza longitud, símbolos, correo y duplicados', () => {
    expect(s.normalizarAlias('  Ｐｏｇｏ   Azul  ')).toBe('Pogo Azul')
    for (const alias of ['', 'ab', 'x'.repeat(19), 'fan@mail.com', '<script>', '🎸🎸🎸', '\u200bPogo']) {
      expect(() => s.crearPerfil(alias)).toThrow()
    }
    s.crearPerfil('Ñandú_42')
    expect(() => s.crearPerfil(' ñANDÚ_42 ')).toThrow('ya existe')
    expect(s.leerPerfiles().perfiles).toHaveLength(1)
  })

  it('persiste, renombra y cambia de perfil sin cruzar ningún resultado', async () => {
    const a = s.crearPerfil('Pogo Azul')
    const progreso = { nivel: 3, nivelBanda: 2, mejor: 8, mejorBanda: 7, partidas: 9, sopas: 2,
      adivinanzas: 4, crucigramas: 3, retosGanados: 1, racha: 2, rachaDias: 1, rachaMax: 1,
      ultimoDia: '2026-10-25', retoHoy: { fecha: '2026-10-25', resultados: [1], terminado: true, gano: true },
      sopaSinPistas: true, adivinanzaSinPistas: true, modosProbados: ['sopa'],
      ultimaEleccion: { modo: 'dicho', categoria: 'discos' }, logros: { primera: '2026-10-25' },
      niveles: { trivia: { 1: { intentos: 2, mejor: 8 } }, banda: {} } }
    s.guardar({ ...progreso, apariencia: 'claro', volumen: 60, sonido: false, dificultad: 'fanatico', tutorial: true })
    const b = s.crearPerfil('Luz Roja')
    expect(s.leer()).toMatchObject({ partidas: 0, nivel: 1, logros: {}, niveles: { trivia: {}, banda: {} }, apariencia: 'claro', volumen: 60, sonido: false, dificultad: 'fanatico', tutorial: true })
    s.sumarSopa()
    s.editarAlias(a, 'Pogo Verde')
    s.seleccionarPerfil(a)
    expect(s.leer()).toMatchObject({ ...progreso, alias: 'Pogo Verde' })
    vi.resetModules()
    s = await import('./storage.js')
    expect(s.leer()).toMatchObject({ ...progreso, alias: 'Pogo Verde' })
    s.seleccionarPerfil(b)
    expect(s.leer()).toMatchObject({ partidas: 1, sopas: 1, alias: 'Luz Roja' })
    expect(() => s.seleccionarPerfil('otro')).toThrow()
  })

  it('migra v5 con copia original y adopción única aun guardando preferencias antes', async () => {
    const anterior = JSON.stringify({ v: 5, nivel: 32, mejor: 10, partidas: 42, sopas: 8,
      nivelBanda: 12, logros: { primera: '2026-10-20' }, apariencia: 'auto', tutorial: true })
    localStorage.setItem('ricota_quiz', anterior)
    vi.resetModules()
    s = await import('./storage.js')
    expect(s.leerPerfiles().pendiente).toBe(true)
    s.guardar({ volumen: 50 })
    expect(localStorage.getItem('ricota_quiz_pre_v6')).toBe(anterior)
    vi.resetModules()
    s = await import('./storage.js')
    const a = s.crearPerfil('Heredero')
    expect(s.leer()).toMatchObject({ nivel: 32, nivelBanda: 12, partidas: 42, sopas: 8, logros: { primera: '2026-10-20' }, apariencia: 'auto', volumen: 50 })
    expect(s.leer().niveles.trivia).toEqual({}) // no inventa un historial inexistente
    s.crearPerfil('Segundo')
    expect(s.leer().partidas).toBe(0)
    s.seleccionarPerfil(a)
    expect(s.leer().partidas).toBe(42)
    expect(s.leerPerfiles().pendiente).toBe(false)
  })

  it('tolera datos dañados y almacenamiento no disponible', async () => {
    localStorage.setItem('ricota_quiz', '{roto')
    vi.resetModules()
    s = await import('./storage.js')
    expect(s.leer().nivel).toBe(1)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    s.crearPerfil('Temporal')
    s.sumarPartida()
    expect(s.leer().partidas).toBe(1)
    expect(s.leerPerfiles().errorPersistencia).toBe(true)
  })

  it('no reemplaza v5 si falla el respaldo durante la adopción', async () => {
    const anterior = JSON.stringify({ v: 5, partidas: 17, nivel: 4 })
    localStorage.setItem('ricota_quiz', anterior)
    vi.resetModules(); s = await import('./storage.js')
    const fallo = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    s.crearPerfil('Primer Alias')
    expect(s.leerPerfiles().errorPersistencia).toBe(true)
    expect(localStorage.getItem('ricota_quiz')).toBe(anterior)
    fallo.mockRestore()
    vi.resetModules(); s = await import('./storage.js')
    expect(s.leerPerfiles().pendiente).toBe(true)
    s.crearPerfil('Recuperado')
    expect(s.leer().partidas).toBe(17)
    s.crearPerfil('Otro Alias')
    expect(s.leer().partidas).toBe(0)
  })

  it('conserva el sonido anterior y alias de longitud límite', async () => {
    localStorage.setItem('ricota_quiz_sonido', 'off')
    vi.resetModules(); s = await import('./storage.js')
    s.crearPerfil('A'.repeat(18))
    expect(s.leer().sonido).toBe(false)
    expect(s.leer().alias).toHaveLength(18)
    expect(s.normalizarAlias('Sol')).toBe('Sol')
  })

  it('mantiene logros y reto del día en el perfil correcto', async () => {
    const { iniciarLogros } = await import('./logros.js')
    const { guardarReto } = await import('./reto.js')
    const detener = iniciarLogros()
    const a = s.crearPerfil('Primero')
    s.sumarSopa(true)
    guardarReto('2026-10-25', [1], true, true)
    guardarReto('2026-10-25', [1], true, true)
    expect(s.leer()).toMatchObject({ partidas: 2, retosGanados: 1 })
    expect(Object.keys(s.leer().logros)).toEqual(expect.arrayContaining(['primera', 'sopaSola', 'reto']))
    s.crearPerfil('Segundo')
    expect(s.leer()).toMatchObject({ logros: {}, retoHoy: null, sopas: 0, retosGanados: 0 })
    s.seleccionarPerfil(a)
    expect(s.leer().retoHoy.gano).toBe(true)
    detener()
  })
})
