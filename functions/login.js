import { compare } from "bcryptjs";

export async function onRequestPost({ request, env }) {
  const { username, password } = await request.json();
  const db = env.DB; // D1 binding

  const user = await db.prepare(
    "SELECT * FROM clients WHERE username = ?"
  ).bind(username).first();

  if (!user) {
    return new Response("Invalid login", { status: 401 });
  }

  const valid = await compare(password, user.password_hash);
  if (!valid) {
    return new Response("Invalid login", { status: 401 });
  }

  const token = await env.JWT.sign({ id: user.id, role: user.role });

  return new Response(JSON.stringify({ token }), {
    headers: { "Content-Type": "application/json" }
  });
}
