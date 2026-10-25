import Fichas from './Fichas.jsx'
import datos from './data/datos-ricotero.json'

// Título corto para que quepa en la ficha; el título completo sigue en los datos.
const CORTOS = { baion: 'Un baión…', bang: '¡Bang! ¡Bang!', mosca: 'La mosca y la sopa', lobo: 'Lobo suelto', finisterre: 'Último bondi', momo: 'Momo Sampler' }

// Fila de fichas de disco que se desliza en horizontal: "Todos" primero y después por año.
// Los discos con pocas canciones siguen disponibles: el juego completa con otros.
export default function SelectorDisco({ valor, onCambio, deshabilitado = false }) {
  const opciones = [
    { id: 'todos', etiqueta: 'Todos', color: 'var(--acento-fill)', deshabilitada: deshabilitado },
    ...[...datos.discos]
      .sort((a, b) => a.anio - b.anio)
      .map((d) => ({ id: d.id, etiqueta: CORTOS[d.id] ?? d.titulo, detalle: String(d.anio), color: 'var(--acento-fill)', deshabilitada: deshabilitado })),
  ]
  return (
    <>
      <p className="etiqueta-grupo">Disco</p>
      <Fichas nombre="Disco" opciones={opciones} valor={valor} onElegir={onCambio} deslizable />
    </>
  )
}
