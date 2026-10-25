import { LOGROS } from './logros.js'
import { leer } from './storage.js'

export default function Logros({ onVolver }) {
  const { logros } = leer()
  const conseguidos = LOGROS.filter((l) => logros[l.id]).length

  return (
    <main className="pantalla" key="logros">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Logros</h2>
        <span className="contador">{conseguidos}/{LOGROS.length}</span>
      </header>
      <ul className="logros">
        {LOGROS.map((l) => {
          const fecha = logros[l.id]
          return (
            <li key={l.id} className={`logro${fecha ? ' hecho' : ''}`}>
              <span className="logro-icono" aria-hidden="true">{fecha ? '🏆' : '🔒'}</span>
              <div>
                <strong>{l.nombre}</strong>
                <p>{l.descripcion}</p>
                <small>{fecha ? `✓ Conseguido el ${fecha}` : 'Todavía bloqueado'}</small>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
