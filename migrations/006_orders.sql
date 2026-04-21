-- Stores PayPal orders (from webhook or client-side)
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  customer_email TEXT,
  product TEXT,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'USD',
  paypal_order_id TEXT,
  status TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
