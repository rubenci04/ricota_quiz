// Efectos generados con la Web Audio API (sin archivos de audio) y vibración corta.
// Nada suena ni vibra hasta la primera interacción del usuario.
import { guardar, leer } from './storage.js'
import { alSonido } from './efectos.js'

let ctx = null
let habilitado = false
let ultimaVictoria = 0

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

if (typeof window !== 'undefined') {
  const alPrimerContacto = () => {
    habilitado = true
    for (const ev of EVENTOS) window.removeEventListener(ev, alPrimerContacto)
    try { contexto() } catch { /* el audio es opcional */ }
  }
  const EVENTOS = ['pointerdown', 'keydown', 'touchstart']
  for (const ev of EVENTOS) window.addEventListener(ev, alPrimerContacto, { passive: true })
}

export const sonidoActivo = () => leer().sonido

export function alternarSonido() {
  return guardar({ sonido: !leer().sonido }).sonido
}

export const vibracionDisponible = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
export const vibracionActiva = () => leer().vibracion

export function alternarVibracion() {
  return guardar({ vibracion: !leer().vibracion }).vibracion
}

function vibrar(patron) {
  if (!habilitado || !vibracionDisponible() || !leer().vibracion) return
  // el navegador solo permite vibrar después de un toque real del usuario
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  try { navigator.vibrate(patron) } catch { /* sin vibración */ }
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

// tipos: clic, ok (acierto), error, pista, victoria
export function sonar(tipo) {
  if (tipo !== 'clic') { try { if (leer().fondo) alSonido(tipo) } catch { /* los efectos visuales son opcionales */ } }
  if (tipo === 'giro') vibrar([12,35,12])
  else if (tipo === 'caida') vibrar([20,35,40])
  else if (tipo === 'ok') vibrar(15)
  else if (tipo === 'error') vibrar([40, 40, 40])
  if (!habilitado || !leer().sonido) return
  try {
    if (tipo === 'giro') {
      ;[0,0.12,0.26,0.45,0.7,1.1,1.6].forEach((t,i)=>tono(180+i*45,t,0.055,'triangle',0.07))
    } else if (tipo === 'caida') {
      tono(110,0,0.12,'triangle',0.12); tono(220,0.15,0.08,'triangle',0.08); tono(440,0.3,0.14,'sine',0.06)
    } else if (tipo === 'clic') {
      tono(700, 0, 0.05, 'square', 0.04)
    } else if (tipo === 'ok') {
      tono(660, 0, 0.12, 'triangle')
      tono(880, 0.1, 0.18, 'triangle')
    } else if (tipo === 'error') {
      tono(180, 0, 0.18, 'sawtooth', 0.1)
      tono(130, 0.14, 0.25, 'sawtooth', 0.1)
    } else if (tipo === 'pista') {
      tono(520, 0, 0.1, 'sine', 0.1)
      tono(780, 0.09, 0.1, 'sine', 0.1)
      tono(1040, 0.18, 0.16, 'sine', 0.08)
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
