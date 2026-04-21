-- Stores all newsletter / early access signups
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  page TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
