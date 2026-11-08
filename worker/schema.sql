-- Tablas del ranking (D1). Se aplica una sola vez: ver RANKING.md.
CREATE TABLE IF NOT EXISTS jugadores (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  partidas INTEGER NOT NULL DEFAULT 0,
  ultimo INTEGER NOT NULL,
  creado INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jugadores_total ON jugadores (total DESC);

CREATE TABLE IF NOT EXISTS puntos (
  id TEXT NOT NULL,
  modo TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  partidas INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, modo)
);
CREATE INDEX IF NOT EXISTS idx_puntos_modo_total ON puntos (modo, total DESC);
