import { useEffect, useRef, useState } from 'react'
import { estadoSuerte, gastarPistaSuerte, limiteTiradas, tirarSuerte } from './suerte.js'
import { sonar } from './sonido.js'

export function useSuertePartida(clave,dif='casual') {
  const p=estadoSuerte(clave)
  return {clave,dif,...p,limite:limiteTiradas(dif),pedir(base,accion){
    if(base<=0&&estadoSuerte(clave).pistas<=0)return false
    if(accion()===false)return false
    if(base<=0)gastarPistaSuerte(clave)
    sonar('pista');return true
  }}
}

const puntos={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]}
export function ObjetoSuerte({resultado,girando}) {
  const rotaciones={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]}
  const [x,y]=resultado.tipo==='dado'?rotaciones[resultado.cara]:[0,resultado.cara==='R'?180:0]
  return <div className={`suerte-escena ${resultado.cara===6?'especial':''}`} aria-label={`Resultado: ${resultado.cara}`}>
    <div className={`suerte-sombra ${girando?'lanzando':''}`} />
    <div className={`suerte-vista ${resultado.tipo}`}><div className={`suerte-objeto ${resultado.tipo} ${girando?'lanzando':''}`} style={{'--rx':`${x}deg`,'--ry':`${y}deg`}}>
      {resultado.tipo==='moneda'?<><span className="moneda-cara p">P</span><span className="moneda-cara r">R</span>{Array.from({length:16},(_,n)=><i key={n} className="moneda-canto" style={{transform:`translateZ(${n-8}px)`}} />)}</>:Array.from({length:6},(_,n)=><div key={n} className={`suerte-cara cara-${n+1}`}><div className="dado-puntos">{Array.from({length:9},(_,i)=><i key={i} className={puntos[n+1].includes(i)?'punto':''}/>)}</div></div>)}
    </div></div>
  </div>
}

export default function AyudaPartida({suerte,base,onPista,errores=0,disabled=false}) {
  const [abierto,setAbierto]=useState(false),[tipo,setTipo]=useState(null),[resultado,setResultado]=useState(null),[girando,setGirando]=useState(false),[aviso,setAviso]=useState('')
  const timer=useRef(), turno=useRef('')
  const restantes=Math.max(0,base)+suerte.pistas, agotadas=suerte.tiradas>=suerte.limite
  useEffect(()=>{
    if(turno.current!==suerte.clave){turno.current=suerte.clave;setAbierto(false);setTipo(null);setResultado(null);setGirando(false);clearTimeout(timer.current)}
  },[suerte.clave])
  useEffect(()=>{if(errores>=2&&restantes===0&&!agotadas&&!disabled)setAbierto(true)},[errores,restantes,agotadas,disabled])
  useEffect(()=>()=>clearTimeout(timer.current),[])
  const tirar=(t,eleccion)=>{
    const r=tirarSuerte(suerte.clave,suerte.dif,t,eleccion)
    if(!r)return
    setResultado(r);setGirando(true);sonar('giro')
    const reducido=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    timer.current=setTimeout(()=>{setGirando(false);setAbierto(false);sonar('caida');setAviso(`Ganaste ${r.pistas} ${r.pistas===1?'pista':'pistas'}.`)},reducido?0:2200)
  }
  return <section className="ayuda-partida" aria-label="Pistas y suerte">
    <button className="secundario" disabled={disabled||girando||(restantes===0&&agotadas)} onClick={()=>{
      if(restantes===0){setAbierto(true);setTipo(null);return}
      setAviso(suerte.pedir(base,onPista)?'Pista aplicada.':'Esta pista ya no puede ayudarte; avanzá en la partida.')
    }}>{restantes>0?`💡 Pista (${restantes})`:agotadas?'Sin pistas · límite de tiradas alcanzado':'🪙 Sin pistas: tentá la suerte'}</button>
    <small>Tiradas: {suerte.tiradas}/{suerte.limite} · solo para esta partida</small>
    {abierto&&!girando&&restantes===0&&!agotadas&&<div className="elegir-suerte">
      <p>Elegí una ayuda. Siempre ganás pistas.</p>
      <button onClick={()=>setTipo('moneda')}>🪙 Moneda</button><button onClick={()=>tirar('dado')}>🎲 Dado</button>
      {tipo==='moneda'&&<><button onClick={()=>tirar('moneda','P')}>Elegir P</button><button onClick={()=>tirar('moneda','R')}>Elegir R</button></>}
    </div>}
    {resultado&&<><ObjetoSuerte resultado={resultado} girando={girando}/>{!girando&&<p role="status">{resultado.tipo==='moneda'?`Salió ${resultado.cara}. `:`Salió ${resultado.cara}. `}{resultado.pistas} {resultado.pistas===1?'pista ganada':'pistas ganadas'}.</p>}</>}
    <p className="bonus-aviso" role="status">{aviso}</p>
  </section>
}
