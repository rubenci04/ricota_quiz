const TECLAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('')

// estado(letra) devuelve '', ' ok' o ' mal'; usada(letra) deshabilita la tecla.
export default function Teclado({ onTecla, onBorrar, estado = () => '', usada = () => false }) {
  return (
    <div className="teclado">
      {TECLAS.map((l) => {
        const e = estado(l)
        const texto = e.includes('ok') ? ', correcta' : e.includes('mal') ? ', incorrecta' : ''
        return (
          <button key={l} className={`tecla${e}`} disabled={usada(l)} onClick={() => onTecla(l)} aria-label={`${l}${texto}`}>
            {l}
          </button>
        )
      })}
      {onBorrar && (
        <button className="tecla borrar" onClick={onBorrar} aria-label="Borrar letra">⌫</button>
      )}
    </div>
  )
}
