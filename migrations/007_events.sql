-- General analytics events (page views, clicks, etc.)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  page TEXT,
  extra TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
