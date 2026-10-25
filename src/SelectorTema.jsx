import Fichas from './Fichas.jsx'
import { TEMAS } from './temas.js'

// Fichas de tema (cada una con su color e ícono). Elegir uno ya aplica el cambio.
export default function SelectorTema({ valor, onCambio, tieneDatos = () => true, deshabilitado = false }) {
  const opciones = [
    { id: 'todos', etiqueta: 'Todos', icono: '🎶', color: 'var(--acento-fill)', deshabilitada: deshabilitado },
    ...TEMAS.map((t) => ({ id: t.id, etiqueta: t.nombre, icono: t.icono, color: t.color, deshabilitada: deshabilitado || !tieneDatos(t.id) })),
  ]
  return (
    <>
      <p className="etiqueta-grupo">Tema</p>
      <Fichas nombre="Tema" opciones={opciones} valor={valor} onElegir={onCambio} />
    </>
  )
}
