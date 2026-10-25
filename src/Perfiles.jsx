import { useState } from 'react'
import { crearPerfil, editarAlias, leer, leerPerfiles, seleccionarPerfil } from './storage.js'

export default function Perfiles({ onElegir, onVolver }) {
  const datos = leerPerfiles()
  const [editando, setEditando] = useState(null)
  const [alias, setAlias] = useState('')
  const [error, setError] = useState('')

  const enviar = (e) => {
    e.preventDefault()
    try {
      if (editando) editarAlias(editando, alias)
      else crearPerfil(alias)
      onElegir()
    } catch (e) { setError(e.message) }
  }

  return (
    <main className="pantalla inicio perfiles">
      <h1>Elegí tu alias</h1>
      <p>Usá un nombre ficticio. Tus perfiles y resultados quedan en este dispositivo.</p>
      <ul className="lista-perfiles" aria-label="Perfiles del dispositivo">
        {datos.perfiles.map((p) => (
          <li key={p.id}>
            <button className="secundario" onClick={() => { seleccionarPerfil(p.id); onElegir() }}>
              {p.alias}{p.id === datos.activo ? ' · activo' : ''}
            </button>
            <button className="secundario" aria-label={`Editar alias de ${p.alias}`} onClick={() => {
              setEditando(p.id); setAlias(p.alias); setError('')
            }}>Editar</button>
          </li>
        ))}
      </ul>
      <form className="form-perfil" onSubmit={enviar}>
        <label htmlFor="alias">{editando ? 'Editar alias' : 'Crear perfil'}</label>
        <input id="alias" value={alias} onChange={(e) => setAlias(e.target.value)} autoComplete="off"
          aria-describedby="alias-ayuda alias-error" />
        <small id="alias-ayuda">De 3 a 18 caracteres. Letras, números, espacios, guion o guion bajo.</small>
        {datos.pendiente && <p role="note">El primer perfil recibirá todo el progreso anterior, una sola vez.</p>}
        <p id="alias-error" role="alert">{error}</p>
        <button className="nueva" type="submit">{editando ? 'Guardar alias' : 'Crear y jugar'}</button>
        {editando && <button className="secundario" type="button" onClick={() => {
          setEditando(null); setAlias(''); setError('')
        }}>Crear otro perfil</button>}
      </form>
      {onVolver && leer().alias && <button className="secundario" onClick={onVolver}>Volver al menú</button>}
    </main>
  )
}
