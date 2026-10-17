CREATE TABLE IF NOT EXISTS business_store (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL DEFAULT '[]'
);
INSERT OR IGNORE INTO business_store (id, data) VALUES (1, '[]');
