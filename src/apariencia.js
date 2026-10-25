// Tema claro / oscuro / automático. Se guarda en el estado persistente y se aplica en <html data-tema>.
import { guardar, leer } from './storage.js'

const COLORES = { oscuro: '#0b0b0c', claro: '#f7f3ea' } // meta theme-color
const consulta = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

export const ORDEN = ['oscuro', 'claro', 'auto']

export function temaEfectivo(valor = leer().apariencia) {
  if (valor === 'claro' || valor === 'oscuro') return valor
  return consulta && !consulta.matches ? 'claro' : 'oscuro'
}

export function aplicarApariencia(valor = leer().apariencia) {
  const tema = temaEfectivo(valor)
  document.documentElement.dataset.tema = tema
  document.documentElement.style.colorScheme = tema === 'claro' ? 'light' : 'dark'
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = COLORES[tema]
  return tema
}

// Pasa al siguiente: oscuro → claro → automático → oscuro.
export function siguienteApariencia() {
  const actual = leer().apariencia
  const nueva = ORDEN[(ORDEN.indexOf(actual) + 1) % ORDEN.length]
  guardar({ apariencia: nueva })
  aplicarApariencia(nueva)
  return nueva
}

// En modo automático el tema sigue los cambios del sistema.
export function seguirSistema() {
  const alCambiar = () => { if (leer().apariencia === 'auto') aplicarApariencia('auto') }
  consulta?.addEventListener?.('change', alCambiar)
  return () => consulta?.removeEventListener?.('change', alCambiar)
}
