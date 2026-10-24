// Efectos generados con la Web Audio API (sin archivos de audio).
const CLAVE = 'ricota_quiz_sonido'
let ctx = null
let activo = true
let ultimaVictoria = 0

try {
  activo = localStorage.getItem(CLAVE) !== 'off'
} catch {
  // sin almacenamiento: queda activado
}

export const sonidoActivo = () => activo

export function alternarSonido() {
  activo = !activo
  try {
    localStorage.setItem(CLAVE, activo ? 'on' : 'off')
  } catch {
    // no se pudo guardar
  }
  return activo
}

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tono(freq, inicio, duracion, tipo = 'sine', volumen = 0.15) {
  const c = contexto()
  if (!c) return
  const osc = c.createOscillator()
  const gain = c.createGain()
  const t0 = c.currentTime + inicio
  osc.type = tipo
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volumen, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + duracion + 0.05)
}

export function sonar(tipo) {
  if (!activo) return
  try {
    if (tipo === 'clic') {
      tono(700, 0, 0.05, 'square', 0.04)
    } else if (tipo === 'ok') {
      tono(660, 0, 0.12, 'triangle')
      tono(880, 0.1, 0.18, 'triangle')
    } else if (tipo === 'error') {
      tono(180, 0, 0.18, 'sawtooth', 0.1)
      tono(130, 0.14, 0.25, 'sawtooth', 0.1)
    } else if (tipo === 'victoria') {
      const ahora = Date.now()
      if (ahora - ultimaVictoria < 600) return
      ultimaVictoria = ahora
      ;[523, 659, 784, 1047].forEach((f, i) => tono(f, i * 0.12, 0.3, 'triangle', 0.14))
    }
  } catch {
    // el audio es opcional
  }
}
