import { useEffect, useState } from 'react'
import Cabecera from './Cabecera.jsx'
import { MODOS_RANKING, leerTop, rankingActivo } from './ranking.js'
import { leer } from './storage.js'

const MEDALLAS = ['🥇', '🥈', '🥉']

export default function Ranking({ onVolver, onMenu }) {
  const [modo, setModo] = useState('global')
  const [datos, setDatos] = useState(undefined) // undefined: cargando · null: sin conexión
  const alias = leer().alias

  useEffect(() => {
    if (!rankingActivo) return undefined
    let vigente = true
    setDatos(undefined)
    leerTop(modo).then((r) => vigente && setDatos(r))
    return () => { vigente = false }
  }, [modo])

  return (
    <main className="pantalla" key="ranking">
      <Cabecera titulo="Ranking" onVolver={onVolver} onMenu={onMenu} />
      {!rankingActivo ? (
        <article className="tarjeta">
          <h2>🏅 Muy pronto</h2>
          <p>Cada partida que completes va a sumar puntos a tu alias, y los 10 mejores van a aparecer acá. Todavía no está activado en esta versión.</p>
        </article>
      ) : (
        <>
          <p className="perfil-activo">Jugás como <strong>{alias}</strong> · cada partida completa suma puntos.</p>
          <div className="chips-ranking" role="group" aria-label="Ranking por juego">
            {MODOS_RANKING.map(([id, texto]) => <button key={id} aria-pressed={modo === id} onClick={() => setModo(id)}>{texto}</button>)}
          </div>
          {datos === undefined && <p role="status">Cargando…</p>}
          {datos === null && <p className="cartel" role="alert">No pudimos conectar con el ranking. Probá de nuevo en un rato.</p>}
          {datos && datos.top.length === 0 && <p role="status">Todavía no hay nadie en esta tabla. ¡Jugá y sé el primero!</p>}
          {datos && datos.top.length > 0 && (
            <ol className="tabla-ranking">
              {datos.top.map((j, i) => (
                <li key={`${j.nombre}-${i}`} className={datos.yo && datos.yo.puesto === i + 1 ? 'yo' : ''}>
                  <span className="pos">{MEDALLAS[i] ?? `${i + 1}º`}</span>
                  <span className="nom">{j.nombre}<small>{j.partidas} {j.partidas === 1 ? 'partida' : 'partidas'}</small></span>
                  <strong>{j.puntos}</strong>
                </li>
              ))}
            </ol>
          )}
          {datos && datos.yo && datos.yo.puesto > 10 && (
            <p className="tu-puesto" role="status">Tu puesto: <strong>{datos.yo.puesto}º</strong> con {datos.yo.puntos} pts. ¡A meterle para llegar al top 10!</p>
          )}
          {datos && !datos.yo && <p className="aviso">Todavía no sumaste puntos acá: terminá una partida para aparecer.</p>}
        </>
      )}
    </main>
  )
}
