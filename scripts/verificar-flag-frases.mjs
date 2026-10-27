import assert from 'node:assert/strict'
import { build } from 'vite'
import { MODOS } from '../src/config.js'
import config from '../vite.config.js'

// No cambia archivos de configuración ni genera otro dist: inspecciona el grafo.
MODOS.completarFrase=false
let modulos=[]
await build({
  ...config,
  configFile:false,
  plugins:[...config.plugins.flat(Infinity).filter(p=>!p?.name?.startsWith('vite-plugin-pwa')),{
    name:'auditar-flag-frases',
    generateBundle(){modulos=[...this.getModuleIds()]},
  }],
  build:{write:false},
})
assert.ok(!modulos.some(id=>/\/src\/data\/frases(?:\.ejemplos)?\.json$/.test(id.replaceAll('\\','/'))))
console.log('Flag false: frases.json y ejemplos excluidos del grafo de producción: OK.')
