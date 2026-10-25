import { TEMAS } from './temas.js'

// Selector de tema; los temas sin datos suficientes quedan deshabilitados (tieneDatos(temaId) → boolean).
export default function SelectorTema({ valor, onCambio, tieneDatos, deshabilitado = false }) {
  return (
    <label className="selector">
      <span>Tema</span>
      <select value={valor} disabled={deshabilitado} onChange={(e) => onCambio(e.target.value)}>
        <option value="todos">Todos</option>
        {TEMAS.map((t) => {
          const ok = tieneDatos(t.id)
          return (
            <option key={t.id} value={t.id} disabled={!ok}>
              {t.nombre}{ok ? '' : ' – pocos datos'}
            </option>
          )
        })}
      </select>
    </label>
  )
}
