CREATE TABLE IF NOT EXISTS payments (
  tx_hash TEXT PRIMARY KEY,
  payer TEXT NOT NULL,
  amount TEXT NOT NULL,
  verified_at TEXT NOT NULL DEFAULT (datetime('now'))
);
