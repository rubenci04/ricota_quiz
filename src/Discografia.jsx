import datos from './data/datos-ricotero.json'
import interpretaciones from './data/interpretaciones.json'

// Solo se muestran interpretaciones verificadas, con su fuente.
const verificadas = new Map(
  interpretaciones.filter((i) => i.verificada === true && i.fuente?.url).map((i) => [i.cancion, i]),
)

const dominio = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function Cancion({ c }) {
  const interp = verificadas.get(c.titulo)
  return (
    <details className="cancion-ficha">
      <summary>
        <strong>{c.titulo}</strong>
        <small>{(c.autores || []).join(' y ')}</small>
      </summary>
      <div className="ficha-cuerpo">
        {c.temas?.length > 0 && (
          <p className="chips" aria-label="Temas">
            {c.temas.map((t) => <span key={t} className="chip">{t}</span>)}
          </p>
        )}
        {interp && (
          <p className="interpretacion">
            <strong>Según {interp.atribuida_a} — {interp.fuente.medio}, {interp.fuente.anio}:</strong> {interp.resumen}{' '}
            <a href={interp.fuente.url} target="_blank" rel="noopener noreferrer">Ver fuente</a>
          </p>
        )}
        <h4>Palabras y definiciones</h4>
        <dl className="definiciones">
          {c.palabras.map((p) => (
            <div key={p}>
              <dt>{p}</dt>
              <dd>{c.definiciones?.[p]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  )
}

export default function Discografia({ onVolver }) {
  const discos = [...datos.discos].sort((a, b) => a.anio - b.anio)
  const curiosidades = (datos.curiosidades || []).filter((c) => c?.texto && c?.fuente)

  return (
    <main className="pantalla" key="discografia">
      <header className="barra">
        <button className="volver" onClick={onVolver} aria-label="Volver al menú">←</button>
        <h2>Discografía</h2>
      </header>

      <section className="discos-lista">
        {discos.map((d) => {
          const canciones = datos.canciones.filter((c) => c.disco === d.id)
          return (
            <details key={d.id} className="disco-ficha">
              <summary>
                <strong>{d.titulo}</strong>
                <small>{d.anio} · {canciones.length} {canciones.length === 1 ? 'canción' : 'canciones'} en el juego</small>
              </summary>
              <div className="ficha-cuerpo">
                {canciones.length === 0 && <p>Todavía no hay canciones de este disco en el juego.</p>}
                {canciones.map((c) => <Cancion key={c.titulo} c={c} />)}
              </div>
            </details>
          )
        })}
      </section>

      {curiosidades.length > 0 && (
        <section className="curiosidades-lista">
          <h3>Curiosidades</h3>
          <ul>
            {curiosidades.map((c) => (
              <li key={c.texto}>
                {c.texto} <a href={c.fuente} target="_blank" rel="noopener noreferrer">{dominio(c.fuente)}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
