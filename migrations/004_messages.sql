-- Stores all contact form submissions
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  page TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
