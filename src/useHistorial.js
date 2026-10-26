import { useEffect, useRef } from 'react'
import { registrarVista } from './historial.js'

// El ref evita registrar dos veces durante la comprobación de efectos de StrictMode.
export function useRegistrarInicial(modo, ids, habilitado) {
  const registrado = useRef(false)
  useEffect(() => {
    if (!habilitado || !ids?.length || registrado.current) return
    registrado.current = true
    registrarVista(modo, ids)
  }, [modo, ids, habilitado])
}
