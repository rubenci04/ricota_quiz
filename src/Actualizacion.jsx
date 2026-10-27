import { useEffect, useState } from 'react'

let registroPromesa, pendiente=false
const oyentes=new Set()
const avisar=()=>{pendiente=true;for(const fn of oyentes)fn(true)}
function registrar() {
 if(!('serviceWorker' in navigator)||import.meta.env.DEV)return
 registroPromesa ||= navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(registro=>{
  if(registro.waiting)avisar()
  registro.addEventListener('updatefound',()=>{
   const nuevo=registro.installing
   nuevo?.addEventListener('statechange',()=>{if(nuevo.state==='installed'&&navigator.serviceWorker.controller)avisar()})
  })
  const comprobar=()=>{if(navigator.onLine&&!document.hidden)registro.update().catch(()=>{})}
  window.addEventListener('online',comprobar);document.addEventListener('visibilitychange',comprobar)
  return registro
 }).catch(()=>null)
}
async function actualizar() {
 const registro=await registroPromesa
 if(!registro?.waiting){location.reload();return}
 navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true})
 registro.waiting.postMessage({type:'SKIP_WAITING'})
}
export default function Actualizacion() {
 const [nueva,setNueva]=useState(pendiente)
 useEffect(()=>{oyentes.add(setNueva);registrar();return()=>oyentes.delete(setNueva)},[])
 return nueva?<aside className="actualizacion" role="status">Hay una versión nueva · <button onClick={actualizar}>Actualizar</button></aside>:null
}
