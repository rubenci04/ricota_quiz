import Fichas from './Fichas.jsx'
import datos from './data/datos-ricotero.json'

const COLORES = ['#e11d48', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']

// Fichas de disco. Los discos con pocas canciones siguen disponibles: el juego completa con otros.
export default function SelectorDisco({ valor, onCambio, deshabilitado = false }) {
  const opciones = [
    { id: 'todos', etiqueta: 'Todos', icono: '💿', color: 'var(--acento-fill)', deshabilitada: deshabilitado },
    ...[...datos.discos]
      .sort((a, b) => a.anio - b.anio)
      .map((d, i) => ({ id: d.id, etiqueta: d.titulo, detalle: String(d.anio), icono: '💿', color: COLORES[i % COLORES.length], deshabilitada: deshabilitado })),
  ]
  return (
    <>
      <p className="etiqueta-grupo">Disco</p>
      <Fichas nombre="Disco" opciones={opciones} valor={valor} onElegir={onCambio} />
    </>
  )
}
