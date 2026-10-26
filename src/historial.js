import { guardar, leer } from './storage.js'
import { nuevaSemilla } from './azar.js'

export function planPara(modo) {
  const h = leer().historial[modo] ?? { vistos: [], partidas: [], ciclo: [] }
  return { vistos: h.vistos, recientes: [...new Set(h.partidas.flat())], ciclo: h.ciclo }
}

export function registrarVista(modo, ids) {
  ids = [...new Set(ids)]
  const e = leer(), h = e.historial[modo] ?? { vistos: [], partidas: [], ciclo: [] }
  const respuesta = ids.find((id) => id.startsWith('r:'))
  const ciclo = respuesta ? [...(h.ciclo.includes(respuesta) ? [] : h.ciclo), respuesta] : []
  guardar({ historial: { ...e.historial, [modo]: { vistos: [...h.vistos, ...ids].slice(-150), partidas: [...h.partidas, ids].slice(-3), ciclo } } })
}

// El plan viaja con la semilla en los desafíos nuevos: el receptor no depende de su historial.
export function crearPartida(modo, generar, identificar) {
  const semilla = nuevaSemilla(), plan = planPara(modo)
  const juego = generar(semilla, plan)
  return { semilla, plan, juego, ids: juego ? identificar(juego) : [] }
}
