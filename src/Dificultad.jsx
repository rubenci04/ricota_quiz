export default function Dificultad({ valor, onCambio, disabled = false }) {
  return (
    <div className="segmentado" role="group" aria-label="Dificultad">
      {[['casual', '🙂 Casual'], ['fanatico', '🔥 Ricotero (fanático)']].map(([id, texto]) => (
        <button key={id} disabled={disabled} aria-pressed={valor === id} onClick={() => onCambio(id)}>{texto}</button>
      ))}
    </div>
  )
}
