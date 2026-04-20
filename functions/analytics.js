export async function onRequestGet({ env }) {
  const db = env.DB;

  const pageviews = await db.prepare(`
    SELECT page, COUNT(*) AS views
    FROM analytics_events
    WHERE event_type = 'pageview'
    GROUP BY page
  `).all();

  const clicks = await db.prepare(`
    SELECT element, COUNT(*) AS clicks
    FROM analytics_events
    WHERE event_type = 'click'
    GROUP BY element
  `).all();

  return new Response(JSON.stringify({ pageviews, clicks }), {
    headers: { "Content-Type": "application/json" }
  });
}
