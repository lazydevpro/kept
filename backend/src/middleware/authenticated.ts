import type { Context, Next } from "hono";
import { createAuth } from "../auth";
import type { AppEnv, Variables } from "../types";

export async function authenticated(
  c: Context<{ Bindings: AppEnv; Variables: Variables }>,
  next: Next,
) {
  const session = await createAuth(c.env, c.req.url).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session?.user.id) {
    return c.json(
      { error: { code: "unauthorized", message: "Sign in to continue." } },
      401,
    );
  }
  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO profiles (user_id, display_name) VALUES (?, ?)",
  )
    .bind(
      session.user.id,
      session.user.name || `Member ${session.user.id.slice(-4).toUpperCase()}`,
    )
    .run();
  c.set("userId", session.user.id);
  await next();
}
