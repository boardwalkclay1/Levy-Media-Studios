export async function onRequestPost({ request, env }) {
  const db = env.DB;
  const data = await request.json();

  await db.prepare(`
    INSERT INTO analytics_events (event_type, page, element, referrer, country, device, ip_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.event_type,
    data.page,
    data.element || null,
    data.referrer || null,
    data.country || null,
    data.device || null,
    data.ip_hash || null
  ).run();

  return new Response("OK");
}
