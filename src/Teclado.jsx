const TECLAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')

// estado(letra) devuelve '', ' ok' o ' mal'; usada(letra) deshabilita la tecla.
export default function Teclado({ onTecla, onBorrar, estado = () => '', usada = () => false }) {
  return (
    <div className="teclado">
      {TECLAS.map((l) => (
        <button key={l} className={`tecla${estado(l)}`} disabled={usada(l)} onClick={() => onTecla(l)}>
          {l}
        </button>
      ))}
      {onBorrar && (
        <button className="tecla borrar" onClick={onBorrar} aria-label="Borrar letra">⌫</button>
      )}
    </div>
  )
}
