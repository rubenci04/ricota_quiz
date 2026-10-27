import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { DESCRIPCION, NOMBRE_JUEGO, URL_JUEGO, MODOS } from './src/config.js'
import { readFileSync } from 'node:fs'

// Reemplaza {{NOMBRE}}, {{DESCRIPCION}} y {{URL}} en index.html con los valores de src/config.js
const REEMPLAZOS = { '{{NOMBRE}}': NOMBRE_JUEGO, '{{DESCRIPCION}}': DESCRIPCION, '{{URL}}': URL_JUEGO }
let produccion = false
function datosDeConfig() {
  return {
    name: 'datos-de-config',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => Object.entries(REEMPLAZOS).reduce((h, [k, v]) => h.split(k).join(v), html),
    },
  }
}

export default defineConfig({
  plugins: [
    {
      name: 'catalogos-publicables',
      configResolved(config) { produccion = config.command === 'build' },
      enforce: 'pre',
      load(id) {
        const ruta = id.replace(/\\/g, '/')
        if (ruta.endsWith('/src/catalogoFrases.js') && !MODOS.completarFrase) return 'export const demoFrases=false; export const catalogoFrases=[]; export const frasesDisponibles=false'
        if (ruta.endsWith('/src/data/frases.ejemplos.json') && produccion) return '[]'
        if (ruta.endsWith('/src/data/frases.json')) return JSON.stringify(JSON.parse(readFileSync(id,'utf8')).filter(f=>f.aprobada===true && !f.ejemplo))
        if (id.replace(/\\/g, '/').endsWith('/src/data/interpretaciones.json')) {
          return JSON.stringify(JSON.parse(readFileSync(id, 'utf8')).filter((i) => i.verificada === true && i.fuente?.url))
        }
      },
    },
    react(),
    datosDeConfig(),
    VitePWA({
      registerType: 'autoUpdate', // una versión nueva reemplaza a la anterior sin pedir nada
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: NOMBRE_JUEGO,
        short_name: NOMBRE_JUEGO,
        description: DESCRIPCION,
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0b0c',
        theme_color: '#0b0b0c',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true, // borra las cachés de versiones anteriores
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/$/], // solo la portada usa el HTML guardado; el resto cae en la página 404
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        globIgnores: ['og.png', '404.html'], // la imagen para compartir no hace falta sin conexión
      },
    }),
  ],
  server: {
    host: true, // accesible desde el celular en la misma wifi
    fs: {
      strict: true,
      // reemplaza la lista por defecto: se repiten sus reglas y se suman las propias
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/datos-pendientes/**',
        '**/letras_privadas/**',
        '**/*.txt',
      ],
    },
  },
})
