CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,          -- 'pageview', 'click', etc.
  page TEXT NOT NULL,
  element TEXT,                      -- clicked element
  referrer TEXT,
  country TEXT,
  device TEXT,
  ip_hash TEXT,                      -- anonymized IP
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
