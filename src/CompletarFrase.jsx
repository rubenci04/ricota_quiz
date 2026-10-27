import { useEffect, useRef, useState } from 'react'
import Cabecera from './Cabecera.jsx'
import Dificultad from './Dificultad.jsx'
import Teclado from './Teclado.jsx'
import Resultado from './Resultado.jsx'
import AyudaPartida, { useSuertePartida } from './AyudaPartida.jsx'
import { generarFrases, demoFrases } from './catalogoFrases.js'
import { idsFrases, normalizarFrase, semillaFrasesDia } from './frases.js'
import { crearPartida, registrarVista } from './historial.js'
import { leer, guardar } from './storage.js'
import { fechaBA } from './reto.js'
import { crearAzar } from './azar.js'

export default function CompletarFrase({onVolver,onMenu,desafio}) {
 const [dif,setDif]=useState(desafio?.dif??'casual')
 const [partida,setPartida]=useState(()=>desafio?{semilla:desafio.semilla,plan:desafio.plan,version:desafio.versionFrases??1,juego:generarFrases(desafio.semilla,desafio.dif,desafio.plan,desafio.versionFrases??1)}:null)
 const [i,setI]=useState(0),[puntos,setPuntos]=useState(0),[fin,setFin]=useState(false)
 const [respuesta,setRespuesta]=useState(null),[errores,setErrores]=useState(0),[pistas,setPistas]=useState(0)
 const [fallosSeguidos,setFallosSeguidos]=useState(0)
 const [elegidas,setElegidas]=useState({}),[hueco,setHueco]=useState(0),[ocultas,setOcultas]=useState({})
 const [letras,setLetras]=useState([]),[fijas,setFijas]=useState([]),[foco,setFoco]=useState(0),[mensaje,setMensaje]=useState('')
 const acciones=useRef(null),guardado=useRef(false)
 const ronda=partida?.juego??[],actual=ronda[i]
 const solucion=actual?actual.faltantes.map(n=>normalizarFrase(actual.palabras[n])).join(''):''
 const suerte=useSuertePartida(`frases:${partida?.version===2?'v2:':''}${partida?.semilla??'entrada'}:${dif}`,dif)
 const presupuesto=dif==='casual'?4:3,base=Math.max(0,presupuesto-pistas)
 const reiniciarPregunta=()=>{setRespuesta(null);setErrores(0);setElegidas({});setHueco(0);setOcultas({});setLetras([]);setFijas([]);setFoco(0);setMensaje('')}
 const empezar=(diario=false)=>{
  const generar=(sem,plan)=>generarFrases(sem,dif,plan)
  const semilla=semillaFrasesDia(fechaBA())
  const p=diario?{semilla,juego:generar(semilla)}:crearPartida('frases',generar,idsFrases)
  if(p.juego.length&&!demoFrases)registrarVista('frases',p.ids??idsFrases(p.juego))
  setPartida({...p,version:2});setI(0);setPuntos(0);setPistas(0);setFallosSeguidos(0);setFin(false);guardado.current=false;reiniciarPregunta()
 }
 const aplicarPista=()=>{
  if(!actual||respuesta!==null)return false
  if(dif==='casual'){
   const n=actual.faltantes[hueco]
   if((ocultas[n]?.length??0)>=2)return false
   const malas=actual.opcionesPorHueco[n].filter(op=>normalizarFrase(op)!==normalizarFrase(actual.palabras[n]))
   setOcultas(v=>({...v,[n]:crearAzar(`${partida.semilla}-${i}-${n}`).mezclar(malas).slice(0,2)}))
  }else{
   const n=[...solucion].findIndex((_,k)=>!fijas.includes(k))
   if(n<0)return false
   setLetras(v=>{const a=[...v];a[n]=solucion[n];return a});setFijas(v=>[...v,n])
   setFoco([...solucion].findIndex((_,k)=>k!==n&&!fijas.includes(k)))
  }
  setPistas(v=>v+1);return true
 }
 const responder=()=>{
  if(respuesta!==null||!actual)return
  if(dif==='casual'&&actual.faltantes.some(n=>!elegidas[n])){setMensaje('Elegí una palabra para cada hueco.');return}
  if(dif==='fanatico'&&[...solucion].some((_,n)=>!letras[n])){setMensaje('Completá todas las casillas.');return}
  const ok=dif==='casual'?actual.faltantes.every(n=>normalizarFrase(elegidas[n])===normalizarFrase(actual.palabras[n])):normalizarFrase(letras.join(''))===normalizarFrase(actual.respuesta)
  setFallosSeguidos(v=>ok?0:v+1)
  if(!ok&&dif==='fanatico'){
   const e=errores+1;setErrores(e);setMensaje('Revisá las letras. Podés pedir una pista o pasar.')
   if(e%2===0&&suerte.pedir(base,aplicarPista))setMensaje('Te revelé una letra después de dos errores.')
   return
  }
  setRespuesta(ok);if(ok)setPuntos(v=>v+1)
 }
 const teclear=l=>{
  if(respuesta!==null||foco<0||fijas.includes(foco))return
  setLetras(v=>{const a=[...v];a[foco]=l;return a})
  const siguiente=[...solucion].findIndex((_,n)=>n>foco&&!fijas.includes(n))
  if(siguiente>=0)setFoco(siguiente)
 }
 const borrar=()=>{
  const n=letras[foco]&&!fijas.includes(foco)?foco:[...solucion].map((_,n)=>n).filter(n=>n<foco&&!fijas.includes(n)).at(-1)
  if(n!==undefined){setLetras(v=>{const a=[...v];a[n]='';return a});setFoco(n)}
 }
 acciones.current=e=>{
  if(!actual||fin||dif!=='fanatico'||respuesta!==null||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return
  if(e.key==='Enter'){const boton=e.target.closest?.('button');if(boton&&!boton.closest('.frase-casillas'))return;e.preventDefault();responder()}
  else if(e.key==='Backspace'){e.preventDefault();borrar()}
  else if(/^[a-záéíóúüñ]$/i.test(e.key)){e.preventDefault();teclear(normalizarFrase(e.key))}
 }
 useEffect(()=>{const fn=e=>acciones.current?.(e);window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[])
 const cabecera=useRef(null)
 useEffect(()=>{if(partida){cabecera.current?.focus({preventScroll:true});cabecera.current?.scrollIntoView({block:'start'})}},[i,partida,fin])
 const siguiente=()=>{
  if(i+1<ronda.length){setI(i+1);reiniciarPregunta();return}
  if(!guardado.current&&!demoFrases){guardado.current=true;const e=leer();guardar({partidas:e.partidas+1,frasesPartidas:e.frasesPartidas+1,mejorFrases:Math.max(e.mejorFrases,puntos),frasesSinPistas:e.frasesSinPistas||(puntos===10&&pistas===0)})}
  setFin(true)
 }
 const pantalla=c=><main className="pantalla pantalla-frases"><div ref={cabecera} tabIndex={-1}><Cabecera titulo="Completá la frase" onVolver={onVolver} onMenu={onMenu}/></div>{demoFrases&&<p>Demo: textos inventados, sin guardar resultados.</p>}{c}</main>
 if(!partida)return pantalla(<><Dificultad valor={dif} onCambio={setDif}/><p>Hasta 10 canciones sin repetir. Casual: dos huecos con opciones; Ricotero: dos o tres palabras con teclado. Un punto por frase completa.</p><button className="nueva" onClick={()=>empezar()}>Jugar</button><button className="secundario" onClick={()=>empezar(true)}>Frases del día</button></>)
 if(!ronda.length)return pantalla(<p role="status">Próximamente. Aún no hay fragmentos válidos disponibles.</p>)
 if(fin)return pantalla(<Resultado titulo="Completá la frase" puntaje={`${puntos}/${ronda.length}`} detalle={`${pistas} pistas usadas`} compartir={`Hice ${puntos}/${ronda.length} en Completá la frase`} exito={puntos>=Math.ceil(ronda.length*.6)} mejor={{etiqueta:'Récord',valor:`${leer().mejorFrases}/10`}} desafio={!demoFrases?{modo:'frases',disco:'todos',dif,semilla:partida.semilla,plan:partida.plan,versionFrases:partida.version,puntaje:puntos}:undefined} rival={desafio}>{!desafio&&<button className="nueva" onClick={()=>empezar()}>Otra ronda de 10 frases</button>}<button className="secundario" onClick={onMenu}>Volver al menú</button></Resultado>)
 const grupoActivo=dif==='fanatico'?actual.faltantes.findIndex((_,g)=>foco<actual.faltantes.slice(0,g+1).reduce((a,j)=>a+normalizarFrase(actual.palabras[j]).length,0)):hueco
 const n=actual.faltantes[Math.max(0,grupoActivo)]
 return pantalla(<>
  <p aria-live="polite">Frase {i+1}/{ronda.length} · {dif==='casual'?'🙂 Casual':'🔥 Ricotero'}</p>
  <progress className="progreso-frases" max={ronda.length} value={i+(respuesta!==null?1:0)} aria-label="Frases completadas"/>
  {dif==='casual'&&<p>Disco: {actual.album}</p>}
  <div className="frase-puzzle" key={`${partida.semilla}:${i}`}>{actual.palabras.map((p,k)=>actual.faltantes.includes(k)?<button className={`frase-hueco ${k===n?'activo':''}`} key={k} disabled={respuesta!==null} aria-label={`Hueco ${actual.faltantes.indexOf(k)+1}`} aria-pressed={k===n} onClick={()=>{const g=actual.faltantes.indexOf(k);setHueco(g);if(dif==='fanatico')setFoco(actual.faltantes.slice(0,g).reduce((a,j)=>a+normalizarFrase(actual.palabras[j]).length,0))}}>{respuesta!==null?p:elegidas[k]||<><strong>Palabra {actual.faltantes.indexOf(k)+1}</strong><small>{normalizarFrase(p).length} letras</small></>}</button>:<span key={k}>{p} </span>)}</div>
  {respuesta!==null?<><p className={`aliento-frase ${respuesta?'acierto':''}`} role="status">{respuesta?['¡Bien ahí, ricotero! Esa tribuna te banca.','¡Venís con todo! Otro punto para tu pogo.','¡Qué memoria, che! Seguí haciendo ruido.'][i%3]:['No aflojes, che. La próxima es tuya.','La tribuna te banca. Seguimos con otra.'][i%2]}</p><p>Respuesta: {actual.respuesta}</p><p>{actual.cancion} · {actual.album}</p><button className="nueva" onClick={siguiente}>{i+1===ronda.length?'Ver resultado':'Siguiente frase'}</button></>:<>
   {dif==='casual'?<><p>Elegí la palabra del hueco {hueco+1}</p><div className="opciones" aria-label={`Opciones del hueco ${hueco+1}`}>{actual.opcionesPorHueco[n].map((op,k)=><button key={k} disabled={ocultas[n]?.includes(op)} aria-pressed={elegidas[n]===op} onClick={()=>{setElegidas(v=>({...v,[n]:op}));if(hueco+1<actual.faltantes.length)setHueco(hueco+1)}}>{ocultas[n]?.includes(op)?'—':op}</button>)}</div></>:<><div className="frase-casillas" role="group" aria-label="Palabras faltantes">{actual.faltantes.map((indice,g)=>{const inicio=actual.faltantes.slice(0,g).reduce((a,j)=>a+normalizarFrase(actual.palabras[j]).length,0);return <span className="frase-palabra" key={indice}>{[...normalizarFrase(actual.palabras[indice])].map((_,j)=>{const k=inicio+j;return <button className={foco===k?'activa':''} key={k} disabled={fijas.includes(k)} aria-label={`Letra ${k+1}`} onClick={()=>setFoco(k)}>{letras[k]||'·'}</button>})}</span>})}</div><Teclado onTecla={teclear} onBorrar={borrar}/></>}
   <AyudaPartida suerte={suerte} base={base} onPista={aplicarPista} errores={fallosSeguidos}/>
   <button className="nueva" onClick={responder}>Comprobar</button><button className="secundario" onClick={()=>setRespuesta(false)}>Pasar</button>
  </>}
  <p role="status">{mensaje}</p>
 </>)
}
