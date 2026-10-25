// Cabecera común a todos los modos: Volver arriba a la izquierda, Menú arriba a la derecha.
export default function Cabecera({ titulo, extra, onVolver, onMenu }) {
  return (
    <header className="barra">
      <button className="btn-nav volver" onClick={onVolver} aria-label="Volver">
        <span aria-hidden="true">←</span> Volver
      </button>
      <div className="barra-titulo">
        <h2>{titulo}</h2>
        {extra != null && extra !== false && <span className="contador">{extra}</span>}
      </div>
      <button className="btn-nav menu-btn" onClick={onMenu ?? onVolver} aria-label="Ir al menú principal">
        <span aria-hidden="true">🏠</span> Menú
      </button>
    </header>
  )
}
