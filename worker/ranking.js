// API del ranking de Ricotero Quiz. Cloudflare Workers + D1 (ambos con plan gratuito).
// Se despliega aparte del juego: ver RANKING.md. No guarda correos ni datos personales:
// un id anónimo generado en el dispositivo, el alias elegido y los puntos.

const MODOS = ['frases', 'trivia', 'banda', 'adivinanzas', 'sopa', 'crucigrama']
// máximo de puntos que puede sumar una partida de cada modo (el cliente nunca manda más)
const MAXIMO = { frases: 100, trivia: 100, banda: 100, adivinanzas: 60, sopa: 100, crucigrama: 100 }
const ESPERA_MS = 15000 // mínimo entre dos envíos del mismo jugador
const ALIAS = /^[\p{L}\p{N}][\p{L}\p{N} _-]{2,17}$/u
const ID = /^[a-f0-9]{24}$/

const origenesPermitidos = (env) => (env.ORIGENES || '').split(',').map((o) => o.trim()).filter(Boolean)

function cabeceras(req, env, extra = {}) {
  const origen = req.headers.get('Origin')
  const ok = origen && origenesPermitidos(env).includes(origen)
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(ok ? { 'Access-Control-Allow-Origin': origen, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Jugador',
    ...extra,
  }
}

const responder = (req, env, cuerpo, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: cabeceras(req, env) })

function nombreValido(valor, env) {
  const nombre = typeof valor === 'string' ? valor.normalize('NFKC').trim().replace(/\s+/gu, ' ') : ''
  if (!ALIAS.test(nombre)) return null
  const plano = nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const bloqueadas = (env.BLOQUEADAS || '').split(',').map((b) => b.trim().toLowerCase()).filter(Boolean)
  return bloqueadas.some((b) => plano.includes(b)) ? null : nombre
}

async function puesto(db, tabla, total, modo) {
  // puesto = jugadores con más puntos + 1
  const sql = modo
    ? 'SELECT COUNT(*) AS n FROM puntos WHERE modo = ? AND total > ?'
    : 'SELECT COUNT(*) AS n FROM jugadores WHERE total > ?'
  const fila = await (modo ? db.prepare(sql).bind(modo, total) : db.prepare(sql).bind(total)).first()
  return (fila?.n ?? 0) + 1
}

async function corteTop10(db, modo) {
  const sql = modo
    ? 'SELECT total FROM puntos WHERE modo = ? ORDER BY total DESC LIMIT 1 OFFSET 9'
    : 'SELECT total FROM jugadores ORDER BY total DESC LIMIT 1 OFFSET 9'
  const fila = await (modo ? db.prepare(sql).bind(modo) : db.prepare(sql)).first()
  return fila?.total ?? null // null: todavía no hay diez jugadores
}

async function enviarPuntaje(req, env) {
  let datos
  try { datos = await req.json() } catch { return responder(req, env, { error: 'json' }, 400) }
  const { id, modo, puntos } = datos ?? {}
  const nombre = nombreValido(datos?.nombre, env)
  if (typeof id !== 'string' || !ID.test(id) || !nombre || !MODOS.includes(modo)) return responder(req, env, { error: 'datos' }, 400)
  if (!Number.isInteger(puntos) || puntos < 0 || puntos > MAXIMO[modo]) return responder(req, env, { error: 'puntos' }, 400)

  const db = env.DB
  const ahora = Date.now()
  const previo = await db.prepare('SELECT ultimo FROM jugadores WHERE id = ?').bind(id).first()
  if (previo && ahora - previo.ultimo < ESPERA_MS) return responder(req, env, { error: 'espera' }, 429)

  await db.batch([
    db.prepare('INSERT INTO jugadores (id, nombre, total, partidas, ultimo, creado) VALUES (?1, ?2, ?3, 1, ?4, ?4) ON CONFLICT(id) DO UPDATE SET nombre = ?2, total = total + ?3, partidas = partidas + 1, ultimo = ?4').bind(id, nombre, puntos, ahora),
    db.prepare('INSERT INTO puntos (id, modo, total, partidas) VALUES (?1, ?2, ?3, 1) ON CONFLICT(id, modo) DO UPDATE SET total = total + ?3, partidas = partidas + 1').bind(id, modo, puntos),
  ])

  const yo = await db.prepare('SELECT total FROM jugadores WHERE id = ?').bind(id).first()
  const yoModo = await db.prepare('SELECT total FROM puntos WHERE id = ? AND modo = ?').bind(id, modo).first()
  const jugadores = await db.prepare('SELECT COUNT(*) AS n FROM jugadores').first()
  return responder(req, env, {
    sumaste: puntos,
    global: { puntos: yo.total, puesto: await puesto(db, null, yo.total), corte: await corteTop10(db, null), jugadores: jugadores.n },
    modo: { puntos: yoModo.total, puesto: await puesto(db, null, yoModo.total, modo), corte: await corteTop10(db, modo) },
  })
}

async function verTop(req, env, url) {
  const modo = url.searchParams.get('modo') || 'global'
  if (modo !== 'global' && !MODOS.includes(modo)) return responder(req, env, { error: 'modo' }, 400)
  const db = env.DB
  const filas = modo === 'global'
    ? await db.prepare('SELECT nombre, total AS puntos, partidas FROM jugadores ORDER BY total DESC, creado ASC LIMIT 10').all()
    : await db.prepare('SELECT j.nombre AS nombre, p.total AS puntos, p.partidas AS partidas FROM puntos p JOIN jugadores j ON j.id = p.id WHERE p.modo = ? ORDER BY p.total DESC, j.creado ASC LIMIT 10').bind(modo).all()
  const id = req.headers.get('X-Jugador')
  let yo = null
  if (id && ID.test(id)) {
    const fila = modo === 'global'
      ? await db.prepare('SELECT total FROM jugadores WHERE id = ?').bind(id).first()
      : await db.prepare('SELECT total FROM puntos WHERE id = ? AND modo = ?').bind(id, modo).first()
    if (fila) yo = { puntos: fila.total, puesto: await puesto(db, null, fila.total, modo === 'global' ? null : modo) }
  }
  return responder(req, env, { modo, top: filas.results ?? [], yo })
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabeceras(req, env) })
    try {
      if (url.pathname === '/api/puntaje' && req.method === 'POST') return await enviarPuntaje(req, env)
      if (url.pathname === '/api/top' && req.method === 'GET') return await verTop(req, env, url)
      return responder(req, env, { error: 'no encontrado' }, 404)
    } catch {
      return responder(req, env, { error: 'servidor' }, 500)
    }
  },
}
