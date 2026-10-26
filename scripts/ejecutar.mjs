// Usa el cargador local de Vite para resolver los imports JSON, sin nuevas dependencias.
import { createServer } from 'vite'
const servidor = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true }, appType: 'custom' })
try { await servidor.ssrLoadModule('/' + process.argv[2]) }
finally { await servidor.close() }
