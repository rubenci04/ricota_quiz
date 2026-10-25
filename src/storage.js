// Progreso y preferencias: se leen una sola vez al iniciar y viven en memoria.
const CLAVE = 'ricota_quiz'
const CLAVE_SONIDO_ANTERIOR = 'ricota_quiz_sonido' // versión previa guardaba el sonido aparte
const VERSION = 5 // versiones anteriores se migran completando los campos nuevos con valores por defecto

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
  volumen: { tipo: 'n', def: 40, min: 0, max: 100 }, // volumen de la música de YouTube
  apariencia: { tipo: 's', def: 'auto', validos: ['auto', 'claro', 'oscuro'] },
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

function cargar() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null')
    const estado = validar(guardado)
    // migración: el sonido se guardaba en otra clave
    if (!guardado || typeof guardado.sonido !== 'boolean') {
      if (localStorage.getItem(CLAVE_SONIDO_ANTERIOR) === 'off') estado.sonido = false
    }
    return estado
  } catch {
    return validar(null)
  }
}

let estado = cargar()
const oyentes = new Set()

const copia = () => JSON.parse(JSON.stringify(estado))

export function leer() {
  return copia()
}

export function guardar(cambios) {
  estado = validar({ ...estado, ...cambios })
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ v: VERSION, ...estado }))
  } catch {
    // sin almacenamiento: se juega igual con el estado en memoria
  }
  for (const fn of oyentes) fn()
  return copia()
}

// Avisa cada vez que cambia el progreso (la usan los logros).
export function suscribir(fn) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

// Una partida terminada en cualquier modo.
export function sumarPartida() {
  guardar({ partidas: estado.partidas + 1 })
}

export function sumarSopa(sinPistas = false) {
  guardar({
    sopas: estado.sopas + 1,
    partidas: estado.partidas + 1,
    sopaSinPistas: estado.sopaSinPistas || sinPistas,
  })
}

export function marcarModo(id) {
  if (!estado.modosProbados.includes(id)) guardar({ modosProbados: [...estado.modosProbados, id] })
}
