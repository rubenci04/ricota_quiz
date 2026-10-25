import { LOGROS } from './logros.js'
import Cabecera from './Cabecera.jsx'
import { leer } from './storage.js'

export default function Logros({ onVolver, onMenu }) {
  const { logros } = leer()
  const conseguidos = LOGROS.filter((l) => logros[l.id]).length

  return (
    <main className="pantalla" key="logros">
      <Cabecera titulo={<>Logros</>} extra={<>{conseguidos}/{LOGROS.length}</>} onVolver={onVolver} onMenu={onMenu} />
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
