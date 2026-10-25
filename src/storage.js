// Progreso y preferencias: se leen una sola vez al iniciar y viven en memoria.
const CLAVE = 'ricota_quiz'
const CLAVE_SONIDO_ANTERIOR = 'ricota_quiz_sonido' // versión previa guardaba el sonido aparte
const VERSION = 6
const PREFERENCIAS = ['sonido', 'volumen', 'apariencia', 'vibracion', 'tutorial', 'dificultad']

export function normalizarAlias(valor) {
  const alias = typeof valor === 'string' ? valor.normalize('NFKC').trim().replace(/\s+/gu, ' ') : ''
  if ([...alias].length < 3 || [...alias].length > 18 || !/^[\p{L}\p{N}][\p{L}\p{N} _-]*$/u.test(alias)) {
    throw new Error('Usá de 3 a 18 caracteres: letras, números, espacios, guion o guion bajo.')
  }
  return alias
}

function validarNiveles(v) {
  const limpio = { trivia: {}, banda: {} }
  for (const modo of ['trivia', 'banda']) {
    for (const [n, dato] of Object.entries(v?.[modo] || {})) {
      if (!/^[1-9]\d?$/.test(n) || !dato || typeof dato !== 'object') continue
      limpio[modo][n] = {
        mejor: Number.isFinite(dato.mejor) ? Math.max(0, Math.min(10, Math.floor(dato.mejor))) : 0,
        intentos: Number.isFinite(dato.intentos) ? Math.max(0, Math.floor(dato.intentos)) : 0,
      }
    }
  }
  return limpio
}

export const MODOS_JUGABLES = ['reto', 'banda', 'sopa', 'trivia', 'adivinanzas', 'crucigrama']
const FECHA = /^\d{4}-\d{2}-\d{2}$/

const esFecha = (v) => typeof v === 'string' && FECHA.test(v)

export const CATEGORIAS_DICHO = ['canciones', 'discos', 'palabras', 'integrantes']

// Última elección en "Dicho de otra forma" / "Por palabras", para ofrecer "Repetir".
function validarEleccion(v) {
  if (!v || typeof v !== 'object') return null
  if (v.modo === 'palabras') return { modo: 'palabras', categoria: 'canciones' }
  if (v.modo === 'dicho' && CATEGORIAS_DICHO.includes(v.categoria)) return { modo: 'dicho', categoria: v.categoria }
  return null
}

function validarReto(v) {
  if (!v || typeof v !== 'object' || !esFecha(v.fecha)) return null
  const resultados = Array.isArray(v.resultados)
    ? v.resultados.filter((x) => Number.isFinite(x)).map((x) => Math.min(1, Math.max(0, x))).slice(0, 6)
    : []
  return { fecha: v.fecha, resultados, terminado: v.terminado === true, gano: v.gano === true }
}

function validarLogros(v) {
  const limpio = {}
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [id, fecha] of Object.entries(v)) if (esFecha(fecha)) limpio[id] = fecha
  }
  return limpio
}

// n: entero >= min · b: booleano · s: texto entre valores válidos · f: función que valida y normaliza
const ESQUEMA = {
  niveles: { tipo: 'f', f: validarNiveles },
  nivel: { tipo: 'n', def: 1, min: 1 },
  mejor: { tipo: 'n', def: 0, min: 0 },
  sopas: { tipo: 'n', def: 0, min: 0 },
  adivinanzas: { tipo: 'n', def: 0, min: 0 },
  racha: { tipo: 'n', def: 0, min: 0 }, // lo usa el Ahorcado (hoy fuera del menú)
  nivelBanda: { tipo: 'n', def: 1, min: 1 },
  mejorBanda: { tipo: 'n', def: 0, min: 0 },
  crucigramas: { tipo: 'n', def: 0, min: 0 },
  partidas: { tipo: 'n', def: 0, min: 0 },
  retosGanados: { tipo: 'n', def: 0, min: 0 },
  rachaDias: { tipo: 'n', def: 0, min: 0 },
  rachaMax: { tipo: 'n', def: 0, min: 0 },
  sopaSinPistas: { tipo: 'b', def: false },
  adivinanzaSinPistas: { tipo: 'b', def: false },
  sonido: { tipo: 'b', def: true },
  volumen: { tipo: 'n', def: 30, min: 0, max: 100 }, // volumen de la música de YouTube
  apariencia: { tipo: 's', def: 'oscuro', validos: ['auto', 'claro', 'oscuro'] },
  ultimaEleccion: { tipo: 'f', def: null, f: validarEleccion },
  vibracion: { tipo: 'b', def: true },
  tutorial: { tipo: 'b', def: false },
  dificultad: { tipo: 's', def: 'casual', validos: ['casual', 'fanatico'] },
  ultimoDia: { tipo: 'f', def: '', f: (v) => (esFecha(v) ? v : '') },
  retoHoy: { tipo: 'f', def: null, f: validarReto },
  modosProbados: {
    tipo: 'f',
    def: [],
    f: (v) => (Array.isArray(v) ? MODOS_JUGABLES.filter((m) => v.includes(m)) : []),
  },
  logros: { tipo: 'f', def: {}, f: validarLogros },
}

function validar(crudo) {
  const origen = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? crudo : {}
  const limpio = {}
  for (const [campo, regla] of Object.entries(ESQUEMA)) {
    const v = origen[campo]
    if (regla.tipo === 'n') limpio[campo] = Number.isFinite(v) ? Math.min(regla.max ?? Infinity, Math.max(regla.min, Math.floor(v))) : regla.def
    else if (regla.tipo === 'b') limpio[campo] = typeof v === 'boolean' ? v : regla.def
    else if (regla.tipo === 's') limpio[campo] = regla.validos.includes(v) ? v : regla.def
    else limpio[campo] = regla.f(v)
  }
  return limpio
}

const clonar = (v) => JSON.parse(JSON.stringify(v))
const preferenciasDe = (v) => Object.fromEntries(PREFERENCIAS.map((k) => [k, v[k]]))
const progresoDe = (v) => Object.fromEntries(Object.entries(validar(v)).filter(([k]) => !PREFERENCIAS.includes(k)))

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null')
    if (guardado?.v === VERSION && Array.isArray(guardado.perfiles)) {
      const perfiles = []
      for (const p of guardado.perfiles) {
        try {
          if (typeof p.id !== 'string' || perfiles.some((x) => x.id === p.id)) continue
          perfiles.push({ id: p.id, alias: normalizarAlias(p.alias), progreso: progresoDe(p.progreso) })
        } catch { /* un perfil inválido no impide leer los demás */ }
      }
      return { v: VERSION, preferencias: preferenciasDe(validar(guardado.preferencias)), perfiles,
        activo: perfiles.some((p) => p.id === guardado.activo) ? guardado.activo : perfiles[0]?.id ?? null,
        pendiente: guardado.pendiente ? progresoDe(guardado.pendiente) : null }
    }
    const estado = validar(guardado)
    // migración: el sonido se guardaba en otra clave
    if (!guardado || typeof guardado.sonido !== 'boolean') {
      if (localStorage.getItem(CLAVE_SONIDO_ANTERIOR) === 'off') estado.sonido = false
    }
    return { v: VERSION, preferencias: preferenciasDe(estado), perfiles: [], activo: null,
      pendiente: guardado ? progresoDe(estado) : null }
  } catch {
    return { v: VERSION, preferencias: preferenciasDe(validar(null)), perfiles: [], activo: null, pendiente: null }
  }
}

let almacen = cargar()
const oyentes = new Set()
let errorPersistencia = false

function publicar() {
  try {
    const anterior = localStorage.getItem(CLAVE)
    if (anterior && JSON.parse(anterior)?.v !== VERSION && !localStorage.getItem(`${CLAVE}_pre_v6`)) {
      localStorage.setItem(`${CLAVE}_pre_v6`, anterior)
    }
    localStorage.setItem(CLAVE, JSON.stringify(almacen))
    errorPersistencia = false
  } catch {
    errorPersistencia = true
  }
  for (const fn of oyentes) fn()
}

export function leerPerfiles() {
  return clonar({ perfiles: almacen.perfiles.map(({ id, alias }) => ({ id, alias })),
    activo: almacen.activo, pendiente: !!almacen.pendiente, errorPersistencia })
}

function aliasDisponible(valor, id) {
  const alias = normalizarAlias(valor)
  if (almacen.perfiles.some((p) => p.id !== id && p.alias.toLocaleLowerCase('es') === alias.toLocaleLowerCase('es'))) {
    throw new Error('Ese alias ya existe en este dispositivo.')
  }
  return alias
}

export function crearPerfil(valor) {
  const alias = aliasDisponible(valor)
  const id = globalThis.crypto.randomUUID()
  const progreso = clonar(almacen.pendiente ?? progresoDe(null))
  almacen.perfiles.push({ id, alias, progreso })
  almacen.pendiente = null // transferencia única: nunca se copia al segundo perfil
  almacen.activo = id
  publicar()
  return id
}

export function seleccionarPerfil(id) {
  if (!almacen.perfiles.some((p) => p.id === id)) throw new Error('Perfil inexistente.')
  almacen.activo = id
  publicar()
}

export function editarAlias(id, valor) {
  const perfil = almacen.perfiles.find((p) => p.id === id)
  if (!perfil) throw new Error('Perfil inexistente.')
  perfil.alias = aliasDisponible(valor, id)
  publicar()
}

export function leer() {
  const perfil = almacen.perfiles.find((p) => p.id === almacen.activo)
  return clonar({ ...validar(null), ...perfil?.progreso, ...almacen.preferencias, alias: perfil?.alias ?? '' })
}

export function guardar(cambios) {
  const nuevo = validar({ ...leer(), ...cambios })
  almacen.preferencias = preferenciasDe(nuevo)
  const perfil = almacen.perfiles.find((p) => p.id === almacen.activo)
  if (perfil) perfil.progreso = progresoDe(nuevo)
  publicar()
  return leer()
}

// Avisa cada vez que cambia el progreso (la usan los logros).
export function suscribir(fn) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

// Una partida terminada en cualquier modo.
export function sumarPartida() {
  guardar({ partidas: leer().partidas + 1 })
}

export function sumarSopa(sinPistas = false) {
  const estado = leer()
  guardar({
    sopas: estado.sopas + 1,
    partidas: estado.partidas + 1,
    sopaSinPistas: estado.sopaSinPistas || sinPistas,
  })
}

export function marcarModo(id) {
  const estado = leer()
  if (!estado.modosProbados.includes(id)) guardar({ modosProbados: [...estado.modosProbados, id] })
}
