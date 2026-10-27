import { useState } from 'react'
import { COMODINES, elegirPremio, tirarDado, tirarMoneda, usarComodin } from './bonus.js'
import { leer, guardar } from './storage.js'
import { sonar } from './sonido.js'
import { fechaBA } from './reto.js'

export function Comodines({ acciones={}, disabled=false }) {
  const [mensaje,setMensaje]=useState('')
  const e=leer()
  return <section className="comodines" aria-label="Comodines virtuales">
    <details><summary>🎒 Comodines ({Object.values(e.bonus.inventario).reduce((a,n)=>a+n,0)})</summary>
      <p>Sin dinero ni compras. Máximo cinco de cada tipo. ⭐ suma un bonus al puntaje del perfil; los desafíos conservan su puntaje base.</p>
      {Object.entries(COMODINES).filter(([id])=>acciones[id]||id==='doble').map(([id,nombre])=><button className="secundario" key={id} disabled={disabled||!e.bonus.inventario[id]||(id==='doble'&&e.bonus.doble)} onClick={()=>{
        const ok=usarComodin(id,acciones[id]??(()=>{const b=leer().bonus;guardarDoble(b);return true}))
        setMensaje(ok?`${nombre} activado`:'No se puede usar en este momento.');if(ok)sonar('pista')
      }}>{nombre} ({e.bonus.inventario[id]})</button>)}
    </details><p role="status" className="bonus-aviso" key={mensaje}>{mensaje}</p>
  </section>
}
// Mantener el inventario y su consumo en una sola operación observable.
function guardarDoble(bonus){guardar({bonus:{...bonus,doble:true}})}

export default function Bonus({ diaria=false }) {
  const [resultado,setResultado]=useState(null), [girando,setGirando]=useState(false)
  const e=leer(), b=e.bonus
  const moneda=diaria&&b.monedaDia!==fechaBA()?'diaria':b.monedas[0]
  const dado=b.dados[0]
  const mostrar=(res,tipo)=>{
    if(!res)return
    setResultado({...res,premio:res.tipo,tipo});setGirando(true);sonar('ok')
    setTimeout(()=>setGirando(false),900)
  }
  return <section className="bonus-panel" aria-label="Bonus virtuales">
    {diaria&&<><p>🎒 Comodines: {Object.values(b.inventario).reduce((a,n)=>a+n,0)} · Bonus: {b.puntos} pts</p><p>🪙 Moneda diaria: <strong>{b.monedaDia===fechaBA()?'Vuelve mañana':'Disponible'}</strong></p></>}
    {moneda&&<div><p>Moneda ricotera · elegí una cara. Si no acertás, no perdés nada.</p><button disabled={girando} onClick={()=>mostrar(tirarMoneda('P',moneda),'moneda')}>Elegir P</button><button disabled={girando} onClick={()=>mostrar(tirarMoneda('R',moneda),'moneda')}>Elegir R</button></div>}
    {dado&&<div><p>🎲 Hito: {dado.replace('primera:','Primera partida · ').replace('racha:','Racha de ').replace('disco:','Disco completado · ')}</p><button disabled={girando} onClick={()=>mostrar(tirarDado(dado),'dado')}>Tirar dado</button></div>}
    {b.elecciones>0&&<div><p>Elegí tu comodín ({b.elecciones} pendientes):</p>{Object.entries(COMODINES).map(([id,t])=><button key={id} disabled={b.inventario[id]>=5} onClick={()=>elegirPremio(id)}>{t}</button>)}</div>}
    {resultado&&<div role="status">
      <div className={`bonus-objeto ${resultado.tipo} ${girando?'girando':''} ${resultado.cara===6?'seis':''}`} style={{'--giro-final':resultado.cara==='R'?'180deg':'0deg'}} aria-label={`Resultado: ${resultado.cara}`}>
        {resultado.tipo==='moneda'?<><span className="cara-p">P</span><span className="cara-r">R</span></>:<>
          <span className="dado-cara frente">{resultado.cara}</span><span className="dado-cara derecha">•</span><span className="dado-cara arriba">••</span>
        </>}
      </div>
      <p>{resultado.tipo==='moneda'?(resultado.acierto?`${COMODINES[resultado.premio]}${resultado.entregados?' ganado':' · inventario lleno'}`:'Sin premio esta vez. No perdiste nada.'):(resultado.cara===3||resultado.cara===4?'Premio a elección.':`${resultado.entregados} comodines recibidos${resultado.entregados===0?' (inventario lleno)':''}.`)}</p>
    </div>}
  </section>
}
