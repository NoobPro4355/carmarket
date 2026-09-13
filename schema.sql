CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  game TEXT NOT NULL,
  category TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  vehicle_id TEXT,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL,
  engine TEXT,
  gearbox TEXT,
  description TEXT,
  player_id TEXT NOT NULL,
  contact TEXT,
  images TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_game ON listings(game);
