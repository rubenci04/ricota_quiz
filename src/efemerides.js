import lista from './data/efemerides.json'
import { fechaBA } from './reto.js'

// Efemérides que caen en el día de hoy (hora de Buenos Aires). Sin coincidencias, devuelve [].
export function efemeridesDeHoy(hoy = fechaBA()) {
  const [anioHoy, mes, dia] = hoy.split('-').map(Number)
  return lista
    .filter((e) => e.mes === mes && e.dia === dia && anioHoy - e.anio > 0 && e.fuente)
    .map((e) => {
      const anios = anioHoy - e.anio
      return { ...e, texto: `Hoy se cumplen ${anios} ${anios === 1 ? 'año' : 'años'} ${e.frase.startsWith('el ') ? 'del ' + e.frase.slice(3) : 'de ' + e.frase}.` }
    })
}
