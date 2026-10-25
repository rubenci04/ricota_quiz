import { guardar, leer } from './storage.js'

export const LIMITES = { trivia: 5, banda: 4 }
export const PUNTOS_PARA_PASAR = 6
export const maximoAlcanzado = (e, modo) => Math.min(e[modo === 'banda' ? 'nivelBanda' : 'nivel'], LIMITES[modo])

export function iniciarNivel(modo, nivel) {
  const e = leer()
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > maximoAlcanzado(e, modo)) throw new Error('Nivel bloqueado.')
  const previo = e.niveles[modo][nivel] ?? { mejor: 0, intentos: 0 }
  return guardar({ niveles: { ...e.niveles, [modo]: { ...e.niveles[modo], [nivel]: { ...previo, intentos: previo.intentos + 1 } } } })
}

export function terminarNivel(modo, nivel, puntos) {
  const e = leer()
  if (!Number.isInteger(nivel) || nivel < 1 || nivel > maximoAlcanzado(e, modo) || !Number.isInteger(puntos) || puntos < 0 || puntos > 10) throw new Error('Resultado inválido.')
  const kNivel = modo === 'banda' ? 'nivelBanda' : 'nivel'
  const kMejor = modo === 'banda' ? 'mejorBanda' : 'mejor'
  const previo = e.niveles[modo][nivel] ?? { mejor: 0, intentos: 0 }
  return guardar({
    [kNivel]: puntos >= PUNTOS_PARA_PASAR ? Math.max(e[kNivel], Math.min(nivel + 1, LIMITES[modo])) : e[kNivel],
    [kMejor]: Math.max(e[kMejor], puntos), partidas: e.partidas + 1,
    niveles: { ...e.niveles, [modo]: { ...e.niveles[modo], [nivel]: { ...previo, mejor: Math.max(previo.mejor, puntos) } } },
  })
}
