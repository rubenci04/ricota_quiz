import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './sistema.css'
import { aplicarApariencia } from './apariencia.js'
import { iniciarAnalitica } from './analitica.js'

aplicarApariencia() // antes de dibujar, para que no parpadee el tema
iniciarAnalitica()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
