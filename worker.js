export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/track" && request.method === "POST") {
      return handleTrack(request, env);
    }

    if (path.startsWith("/api/admin/")) {
      return handleAdmin(request, env);
    }

    if (path === "/api/paypal/return") {
      return handlePayPalReturn(request, env);
    }

    return new Response("Not found", { status: 404 });
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function handleTrack(request, env) {
  const db = env.DB;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  const { event_type, page, extra = {} } = body;

  // CONTACT MESSAGE
  if (event_type === "contact_message" && extra.name && extra.email && extra.message) {
    await db
      .prepare(
        `INSERT INTO messages (name, email, message, page) VALUES (?, ?, ?, ?)`
      )
      .bind(extra.name, extra.email, extra.message, page || null)
      .run();
  }

  // LEAD SIGNUP
  if (event_type === "lead_signup" && extra.name && extra.email) {
    await db
      .prepare(
        `INSERT INTO leads (name, email, page) VALUES (?, ?, ?)`
      )
      .bind(extra.name, extra.email, page || null)
      .run();
  }

  // GENERIC ANALYTICS
  await db
    .prepare(
      `INSERT INTO events (event_type, page, extra) VALUES (?, ?, ?)`
    )
    .bind(event_type, page || null, JSON.stringify(extra))
    .run();

  return json({ ok: true });
}

async function handleAdmin(request, env) {
  const url = new URL(request.url);
  const key = request.headers.get("x-admin-key");
  if (key !== env.ADMIN_KEY) return new Response("Unauthorized", { status: 401 });

  const db = env.DB;
  const table = url.pathname.replace("/api/admin/", "");

  const allowed = ["messages", "leads", "events", "orders"];
  if (!allowed.includes(table)) return new Response("Not found", { status: 404 });

  const { results } = await db
    .prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 500`)
    .all();

  return json(results);
}

async function handlePayPalReturn(request, env) {
  const url = new URL(request.url);

  const name = url.searchParams.get("name");
  const email = url.searchParams.get("email");
  const product = url.searchParams.get("product");
  const amount = url.searchParams.get("amount"); // cents
  const orderId = url.searchParams.get("orderId");

  if (!orderId) return json({ error: "Missing orderId" }, 400);

  await env.DB
    .prepare(
      `INSERT INTO orders (customer_name, customer_email, product, amount_cents, paypal_order_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(name, email, product, amount, orderId, "RETURN_URL_CAPTURED")
    .run();

  return Response.redirect("/pages/success.html", 302);
}
