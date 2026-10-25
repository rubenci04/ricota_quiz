// Cloudflare Web Analytics (sin cookies). Solo se carga si ANALITICA.activa es true en config.js.
import { ANALITICA } from './config.js'

export function iniciarAnalitica() {
  if (!ANALITICA.activa || !ANALITICA.token) return
  const s = document.createElement('script')
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: ANALITICA.token }))
  document.head.appendChild(s)
}
