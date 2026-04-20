CREATE TABLE IF NOT EXISTS editor_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  page TEXT NOT NULL,
  action TEXT NOT NULL,              -- 'update', 'delete', etc.
  details TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
