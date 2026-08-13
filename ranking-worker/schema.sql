CREATE TABLE IF NOT EXISTS votes (
  device_hash TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (device_hash, artist_id)
);

CREATE INDEX IF NOT EXISTS votes_artist_id_index ON votes (artist_id);

CREATE TABLE IF NOT EXISTS ranking_totals (
  artist_id TEXT PRIMARY KEY,
  points10 INTEGER NOT NULL DEFAULT 0 CHECK (points10 >= 0),
  voters INTEGER NOT NULL DEFAULT 0 CHECK (voters >= 0),
  normal INTEGER NOT NULL DEFAULT 0 CHECK (normal >= 0),
  gold INTEGER NOT NULL DEFAULT 0 CHECK (gold >= 0),
  rainbow INTEGER NOT NULL DEFAULT 0 CHECK (rainbow >= 0),
  updated_at TEXT NOT NULL
);
