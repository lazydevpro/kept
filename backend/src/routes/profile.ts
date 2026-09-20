import { Hono } from "hono";
import { z } from "zod";
import { ApiError, id } from "../lib/http";
import { parseJson, publicProfile } from "../lib/validation";
import type { AppEnv, Variables } from "../types";

export const profileRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

profileRoutes.get("/me", async (c) => {
  const userId = c.get("userId");
  let profile = await c.env.DB.prepare(
    "SELECT * FROM profiles WHERE user_id = ?",
  )
    .bind(userId)
    .first();
  if (!profile) {
    const displayName = `Member ${userId.slice(-4).toUpperCase()}`;
    await c.env.DB.prepare(
      "INSERT INTO profiles (user_id, display_name) VALUES (?, ?)",
    )
      .bind(userId, displayName)
      .run();
    profile = await c.env.DB.prepare("SELECT * FROM profiles WHERE user_id = ?")
      .bind(userId)
      .first();
  }
  const wallets = await c.env.DB.prepare(
    "SELECT id, address, chain, verified_at FROM wallet_connections WHERE user_id = ? ORDER BY created_at DESC",
  )
    .bind(userId)
    .all();
  return c.json({
    profile: publicProfile(profile ?? {}),
    wallets: wallets.results,
  });
});

profileRoutes.patch("/me", async (c) => {
  const body = await parseJson(
    c,
    z.object({
      displayName: z.string().trim().min(2).max(40).optional(),
      privacyMode: z.enum(["progress_only", "amounts", "holdings"]).optional(),
      timezone: z.string().trim().min(1).max(64).optional(),
    }),
  );
  if (Object.keys(body).length === 0)
    throw new ApiError(422, "Choose something to update.");
  const userId = c.get("userId");
  await c.env.DB.prepare(
    `INSERT INTO profiles (user_id, display_name, privacy_mode, timezone)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       display_name = excluded.display_name,
       privacy_mode = excluded.privacy_mode,
       timezone = excluded.timezone`,
  )
    .bind(
      userId,
      body.displayName ?? `Member ${userId.slice(-4)}`,
      body.privacyMode ?? "progress_only",
      body.timezone ?? "UTC",
    )
    .run();
  const profile = await c.env.DB.prepare(
    "SELECT * FROM profiles WHERE user_id = ?",
  )
    .bind(userId)
    .first();
  return c.json({ profile: publicProfile(profile ?? {}) });
});

profileRoutes.post("/me/push-tokens", async (c) => {
  const body = await parseJson(
    c,
    z.object({
      token: z.string().min(8).max(512),
      platform: z.enum(["android", "ios"]),
    }),
  );
  await c.env.DB.prepare(
    `INSERT INTO push_tokens (id, user_id, token, platform) VALUES (?, ?, ?, ?)
     ON CONFLICT(token) DO UPDATE SET user_id = excluded.user_id, platform = excluded.platform, enabled = 1, updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(id("push"), c.get("userId"), body.token, body.platform)
    .run();
  return c.json({ registered: true }, 201);
});
