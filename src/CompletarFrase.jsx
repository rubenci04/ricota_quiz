import { useEffect, useRef, useState } from 'react'
import { Comodines } from './Bonus.jsx'
import Cabecera from './Cabecera.jsx'
import Dificultad from './Dificultad.jsx'
import Teclado from './Teclado.jsx'
import Resultado from './Resultado.jsx'
import { catalogoFrases, demoFrases } from './catalogoFrases.js'
import { armarRondaFrases, idsFrases, normalizarFrase, semillaFrasesDia } from './frases.js'
import { crearPartida, registrarVista } from './historial.js'
import { leer, guardar } from './storage.js'
import { fechaBA } from './reto.js'
import { crearAzar } from './azar.js'

export default function CompletarFrase({ onVolver, onMenu, desafio }) {
  const [dif, setDif] = useState(desafio?.dif ?? 'casual')
  const [partida, setPartida] = useState(() => desafio ? { semilla: desafio.semilla, plan: desafio.plan, juego: armarRondaFrases(catalogoFrases, desafio.semilla, desafio.dif, desafio.plan) } : null)
  const [i, setI] = useState(0), [puntos, setPuntos] = useState(0)
  const [respuesta, setRespuesta] = useState(null), [errores, setErrores] = useState(0)
  const [letras, setLetras] = useState([]), [fijas, setFijas] = useState([]), [foco, setFoco] = useState(0)
  const [ocultas, setOcultas] = useState([]), [pistas, setPistas] = useState(0), [fin, setFin] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const acciones = useRef(null), guardado = useRef(false)
  const ronda = partida?.juego ?? [], actual = ronda[i]
  const solucion = actual ? actual.faltantes.map(n=>normalizarFrase(actual.palabras[n])).join('') : ''
  const reiniciarPregunta = () => { setRespuesta(null); setErrores(0); setLetras([]); setFijas([]); setFoco(0); setOcultas([]); setMensaje('') }
  const empezar = (diario = false) => {
    const generar = (sem, plan) => armarRondaFrases(catalogoFrases, sem, dif, plan, { demo: demoFrases })
    const semillaDia = semillaFrasesDia(fechaBA())
    const p = diario ? { semilla: semillaDia, juego: generar(semillaDia) } : crearPartida('frases', generar, idsFrases)
    if (p.juego.length && !diario && !demoFrases) registrarVista('frases', p.ids)
    setPartida(p); setI(0); setPuntos(0); setPistas(0); setFin(false); guardado.current=false; reiniciarPregunta()
  }
  const responder = (texto) => {
    if (respuesta !== null || !actual) return
    const ok = normalizarFrase(texto) === normalizarFrase(actual.respuesta)
    if (!ok && dif==='fanatico') {
      const e = errores+1; setErrores(e); setMensaje('Todavía no. Revisá las letras o pasá a la siguiente frase.')
      if (e % 2 === 0) {
        const n = [...solucion].findIndex((_,k)=>!fijas.includes(k))
        if (n>=0) { setLetras(v=>{ const a=[...v]; a[n]=solucion[n]; return a }); setFijas(v=>[...v,n]); setPistas(v=>v+1); setFoco([...solucion].findIndex((_,k)=>k!==n&&!fijas.includes(k))); setMensaje('Te revelé una letra después de dos errores.') }
      }
      return
    }
    setRespuesta(ok); if(ok) setPuntos(v=>v+1)
  }
  const teclear = l => {
    if(respuesta!==null || foco<0) return
    setLetras(v=>{const a=[...v];a[foco]=l;return a})
    const proxima=[...solucion].findIndex((_,k)=>k>foco&&!fijas.includes(k))
    if(proxima>=0) setFoco(proxima)
  }
  const borrar = () => {
    const n=letras[foco]&&!fijas.includes(foco)?foco:[...solucion].map((_,k)=>k).filter(k=>k<foco&&!fijas.includes(k)).at(-1)
    if(n!==undefined){setLetras(v=>{const a=[...v];a[n]='';return a});setFoco(n)}
  }
  acciones.current = e => {
    if(!actual || fin || dif!=='fanatico' || respuesta!==null || e.ctrlKey || e.metaKey || e.altKey) return
    if(e.key==='Enter'){e.preventDefault();responder(letras.join(''))}
    else if(e.key==='Backspace'){e.preventDefault();borrar()}
    else if(/^[a-záéíóúüñ]$/i.test(e.key)){e.preventDefault();teclear(normalizarFrase(e.key))}
  }
  useEffect(()=>{const fn=e=>acciones.current?.(e);window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[])
  const siguiente = () => {
    if(i+1<ronda.length){setI(i+1);reiniciarPregunta();return}
    if(!guardado.current && !demoFrases){
      guardado.current=true
      const e=leer();guardar({partidas:e.partidas+1,frasesPartidas:e.frasesPartidas+1,mejorFrases:Math.max(e.mejorFrases,puntos),frasesSinPistas:e.frasesSinPistas||(puntos===10&&pistas===0)})
    }
    setFin(true)
  }
  const usarPista = () => {
    const malas = actual.opciones.map((_, k) => k)
      .filter(k => normalizarFrase(actual.opciones[k]) !== normalizarFrase(actual.respuesta))
    setOcultas(crearAzar(`${partida.semilla}-${i}`).mezclar(malas).slice(0, 2))
    setPistas(v => v + 1)
  }
  const pantalla = contenido => (
    <main className="pantalla">
      <Cabecera titulo="Completá la frase" onVolver={onVolver} onMenu={onMenu} />
      {demoFrases && <p className="aviso">Demo de desarrollo: seis textos inventados, sin guardar resultados.</p>}
      {contenido}
    </main>
  )
  if (!partida) return pantalla(<>
    <Dificultad valor={dif} onCambio={setDif} />
    <p>10 frases y 10 canciones diferentes. Un punto por acierto. Casual: cuatro opciones y álbum; Ricotero: para fanáticos, escribí las palabras y recibí una letra tras dos errores.</p>
    <button className="nueva" onClick={() => empezar()}>Jugar</button>
    <button className="secundario" onClick={() => empezar(true)}>Frases del día</button>
  </>)
  if (!ronda.length) return pantalla(
    <p role="status">Próximamente. Necesitamos diez frases aprobadas de canciones distintas para una ronda completa.</p>
  )
  if (fin) return pantalla(
    <Resultado
      exito={puntos>=6}
      titulo="Completá la frase"
      puntaje={`${puntos}/${ronda.length}`}
      detalle={`${pistas} ayudas utilizadas`}
      compartir={`Hice ${puntos}/${ronda.length} en Completá la frase`}
      mejor={{ etiqueta: 'Récord', valor: `${leer().mejorFrases}/10` }}
      desafio={!demoFrases ? { modo: 'frases', disco: 'todos', dif, semilla: partida.semilla, plan: partida.plan, puntaje: puntos } : undefined}
      rival={desafio}
    >
      <button className="nueva" onClick={onMenu}>Volver al menú</button>
    </Resultado>
  )
  return pantalla(<>
    <Comodines disabled={respuesta===true} acciones={{
      ...(dif==='casual'?{mitad:()=>{if(ocultas.length)return false;usarPista()}}:{pista:()=>{
        const n=[...solucion].findIndex((_,k)=>!fijas.includes(k));if(n<0)return false;
        setLetras(v=>{const a=[...v];a[n]=solucion[n];return a});setFijas(v=>[...v,n]);setPistas(v=>v+1)
      }}),
      oportunidad:()=>{if(respuesta!==false)return false;setRespuesta(null);setMensaje('Segunda oportunidad')}
    }} />
    <p>{i + 1}/{ronda.length} · {dif === 'casual' ? '🙂 Casual' : '🔥 Ricotero (fanático)'}</p>
    {dif === 'casual' && <p>Álbum: {actual.album}</p>}
    <p className="frase-puzzle">
      {actual.palabras.map((p, k) => <span key={k}>{actual.faltantes.includes(k) ? '▯'.repeat(normalizarFrase(p).length) : p} </span>)}
    </p>
    {respuesta !== null ? <>
      <p role="status">{respuesta ? '¡Correcto!' : 'La respuesta era:'} {actual.respuesta}</p>
      <p>{actual.cancion} · {actual.album}</p>
      <button className="nueva" onClick={siguiente}>{i + 1 === ronda.length ? 'Ver resultado' : 'Siguiente'}</button>
    </> : dif === 'casual' ? <>
      <div className="opciones">
        {actual.opciones.map((op, k) => (
          <button key={k} disabled={ocultas.includes(k)} onClick={() => responder(op)}>{ocultas.includes(k) ? '—' : op}</button>
        ))}
      </div>
      <button className="secundario" disabled={ocultas.length > 0} onClick={usarPista}>Pista: eliminar dos opciones</button>
    </> : <>
      <div className="frase-casillas" role="group" aria-label="Palabras faltantes">
        {actual.faltantes.map((n, grupo) => {
          const inicio = actual.faltantes.slice(0, grupo).reduce((a, j) => a + normalizarFrase(actual.palabras[j]).length, 0)
          return <span className="frase-palabra" key={n}>
            {[...normalizarFrase(actual.palabras[n])].map((_, j) => {
              const k = inicio + j
              return <button className={foco === k ? 'activa' : ''} key={k} disabled={fijas.includes(k)} aria-label={`Letra ${k + 1}`} onClick={() => setFoco(k)}>{letras[k] || '·'}</button>
            })}
          </span>
        })}
      </div>
      <Teclado onTecla={teclear} onBorrar={borrar} />
      <button className="nueva" onClick={() => responder(letras.join(''))}>Comprobar</button>
      <button className="secundario" onClick={() => setRespuesta(false)}>Pasar</button>
    </>}
    <p role="status">{mensaje}</p>
  </>)
}
