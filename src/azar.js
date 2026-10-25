// Azar con semilla (mulberry32). Sin semilla se comporta como Math.random.

export function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Convierte un texto (por ejemplo una fecha) en un número de semilla.
export function hashSemilla(texto) {
  let h = 1779033703 ^ texto.length
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^ (h >>> 16)) >>> 0
}

export function crearAzar(semilla) {
  const rnd =
    semilla === undefined || semilla === null
      ? Math.random
      : mulberry32(typeof semilla === 'number' ? semilla >>> 0 : hashSemilla(String(semilla)))
  const entero = (n) => Math.floor(rnd() * n)
  return {
    rnd,
    entero,
    elegir: (arr) => arr[entero(arr.length)],
    // Fisher–Yates
    mezclar(arr) {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = entero(i + 1)
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
}
