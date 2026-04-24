/**
 * worker.js
 * Cloudflare Worker entrypoint for Levy Media Studios
 *
 * Bindings required in wrangler.toml:
 * [[d1_databases]]
 * binding = "DB"
 * database_name = "levy-db"
 * database_id = "<YOUR_D1_DB_ID>"
 *
 * [vars]
 * ADMIN_KEY = "<STRONG_RANDOM_KEY>"
 *
 * Routes:
 * - POST  /api/track                -> ingest events, messages, leads
 * - POST  /api/admin/login          -> admin login (email + password) -> returns token
 * - POST  /api/admin/create-first   -> create initial admin (requires x-admin-key)
 * - GET   /api/admin/:table         -> admin read endpoints (messages, leads, events, orders) (requires auth)
 * - GET   /api/paypal/return        -> capture order via return URL and persist
 * - POST  /api/paypal/webhook       -> optional PayPal webhook receiver (verify in prod)
 *
 * Notes:
 * - Do NOT embed ADMIN_KEY in client code. Store it in Worker env or wrangler.toml.
 * - Admin tokens are HMAC-signed using ADMIN_KEY and short-lived.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    try {
      if (pathname === "/api/track" && request.method === "POST") {
        return await handleTrack(request, env);
      }

      if (pathname === "/api/admin/login" && request.method === "POST") {
        return await handleAdminLogin(request, env);
      }

      if (pathname === "/api/admin/create-first" && request.method === "POST") {
        return await handleCreateFirstAdmin(request, env);
      }

      if (pathname.startsWith("/api/admin/") && request.method === "GET") {
        return await handleAdminRead(request, env);
      }

      if (pathname === "/api/paypal/return" && request.method === "GET") {
        return await handlePayPalReturn(request, env);
      }

      if (pathname === "/api/paypal/webhook" && request.method === "POST") {
        return await handlePayPalWebhook(request, env);
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      return json({ error: err?.message || "internal error" }, 500);
    }
  }
};

/* ---------- Helpers ---------- */

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function base64UrlEncode(bytes) {
  // bytes: Uint8Array
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeToUint8Array(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

/* ---------- Password hashing (PBKDF2) ---------- */

async function hashPassword(password) {
  // returns salt:hash (both base64url) string
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(derived);
  return `${base64UrlEncode(salt)}:${base64UrlEncode(hash)}`;
}

async function verifyPassword(password, stored) {
  try {
    const [saltB64, hashB64] = stored.split(":");
    if (!saltB64 || !hashB64) return false;
    const salt = base64UrlDecodeToUint8Array(saltB64);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const hash = new Uint8Array(derived);
    return base64UrlEncode(hash) === hashB64;
  } catch {
    return false;
  }
}

/* ---------- Token signing (HMAC-SHA256) ---------- */

async function signToken(payloadObj, env, ttlSeconds = 3600) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { ...payloadObj, iat: now, exp: now + ttlSeconds };
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const data = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ADMIN_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sigB64 = base64UrlEncode(new Uint8Array(sig));
  return `${data}.${sigB64}`;
}

async function verifyToken(token, env) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.ADMIN_KEY),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sig = base64UrlDecodeToUint8Array(sigB64);
    const ok = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
    if (!ok) return null;
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

/* ---------- Auth helper ---------- */

async function requireAdminAuth(request, env) {
  // Accept either Authorization: Bearer <token> OR x-admin-key (bootstrap)
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    const payload = await verifyToken(token, env);
    if (payload) return { ok: true, user: payload };
    return { ok: false };
  }
  const key = request.headers.get("x-admin-key");
  if (key && env.ADMIN_KEY && key === env.ADMIN_KEY) {
    return { ok: true, user: { bootstrap: true } };
  }
  return { ok: false };
}

/* ---------- Route handlers ---------- */

async function handleTrack(request, env) {
  const db = env.DB;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  const { event_type = "unknown", page = null, extra = {} } = body;

  // Persist contact messages
  if (event_type === "contact_message" && extra.name && extra.email && extra.message) {
    await db
      .prepare(`INSERT INTO messages (name, email, message, page) VALUES (?, ?, ?, ?)`)
      .bind(extra.name, extra.email, extra.message, page)
      .run();
  }

  // Persist lead signups
  if (event_type === "lead_signup" && extra.name && extra.email) {
    await db
      .prepare(`INSERT INTO leads (name, email, page) VALUES (?, ?, ?)`)
      .bind(extra.name, extra.email, page)
      .run();
  }

  // Generic analytics event
  await db
    .prepare(`INSERT INTO events (event_type, page, extra) VALUES (?, ?, ?)`)
    .bind(event_type, page, JSON.stringify(extra || {}))
    .run();

  return json({ ok: true });
}

/* Admin: login */
async function handleAdminLogin(request, env) {
  const db = env.DB;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);
  const { email, password } = body;
  if (!email || !password) return json({ error: "Missing credentials" }, 400);

  const { results } = await db.prepare(`SELECT * FROM admin_users WHERE email = ? LIMIT 1`).bind(email).all();
  const user = results && results[0];
  if (!user) return json({ error: "Invalid credentials" }, 401);

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return json({ error: "Invalid credentials" }, 401);

  const token = await signToken({ sub: user.id, email: user.email }, env, 3600);
  return json({ token });
}

/* Admin: create-first (bootstrap) */
async function handleCreateFirstAdmin(request, env) {
  // Requires x-admin-key header to protect creation
  const key = request.headers.get("x-admin-key");
  if (!key || key !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });

  const db = env.DB;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);
  const { email, password } = body;
  if (!email || !password) return json({ error: "Missing fields" }, 400);

  const password_hash = await hashPassword(password);

  await db.prepare(`INSERT INTO admin_users (email, password_hash) VALUES (?, ?)`).bind(email, password_hash).run();
  return json({ ok: true });
}

/* Admin: read tables */
async function handleAdminRead(request, env) {
  const auth = await requireAdminAuth(request, env);
  if (!auth.ok) return new Response("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const table = url.pathname.replace("/api/admin/", "").replace(/^\/|\/$/g, "");
  const allowed = ["messages", "leads", "events", "orders"];
  if (!allowed.includes(table)) return new Response("Not found", { status: 404 });

  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 1000);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

  const stmt = `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const { results } = await env.DB.prepare(stmt).bind(limit, offset).all();

  return json(results || []);
}

/* PayPal return URL capture */
async function handlePayPalReturn(request, env) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return json({ error: "Missing orderId" }, 400);

  const name = url.searchParams.get("name") || null;
  const email = url.searchParams.get("email") || null;
  const product = url.searchParams.get("product") || null;
  const amount = url.searchParams.get("amount") || null; // expected cents or minor units

  await env.DB
    .prepare(
      `INSERT INTO orders (customer_name, customer_email, product, amount_cents, paypal_order_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(name, email, product, amount ? parseInt(amount, 10) : null, orderId, "RETURN_URL_CAPTURED")
    .run();

  return Response.redirect("/pages/success.html", 302);
}

/* PayPal webhook (placeholder) */
async function handlePayPalWebhook(request, env) {
  // IMPORTANT: In production verify PayPal webhook signature before trusting payload.
  const db = env.DB;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  const eventType = body.event_type || "paypal_webhook";
  const resource = body.resource || {};

  const orderId = resource.id || resource.order_id || null;
  const payerEmail =
    (resource.payer && (resource.payer.email_address || resource.payer.email)) ||
    null;
  const payerName =
    (resource.payer && resource.payer.name && `${resource.payer.name.given_name || ""} ${resource.payer.name.surname || ""}`) ||
    null;
  const amount =
    (resource.purchase_units && resource.purchase_units[0] && resource.purchase_units[0].amount && resource.purchase_units[0].amount.value) ||
    null;
  const amountCents = amount ? Math.round(parseFloat(amount) * 100) : null;

  if (orderId) {
    await db
      .prepare(
        `INSERT INTO orders (customer_name, customer_email, product, amount_cents, paypal_order_id, status)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(payerName, payerEmail, null, amountCents, orderId, eventType)
      .run();
  }

  await db
    .prepare(`INSERT INTO events (event_type, page, extra) VALUES (?, ?, ?)`)
    .bind(eventType, "/api/paypal/webhook", JSON.stringify(resource))
    .run();

  return json({ ok: true });
}
