import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
