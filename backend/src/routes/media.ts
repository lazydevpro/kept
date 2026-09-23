import { Hono } from "hono";
import { ApiError } from "../lib/http";
import type { AppEnv } from "../types";

export const mediaRoutes = new Hono<{ Bindings: AppEnv }>();

function escapeXml(value: string) {
  return value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '\"': "&quot;",
      })[character]!,
  );
}

/**
 * A shareable card for one kept promise.
 *
 * Public by design — it is the image a share lands with, and whoever receives
 * it has no KEPT session. So it serves only what the person chose to share: a
 * `promise_kept` post, their display name, and never an amount. Other feed
 * entries (joins, nudges) are circle business and 404 here. Post ids are 128
 * random bits, so a card cannot be found without being given its link.
 */
mediaRoutes.get("/share/:file", async (c) => {
  // Not `/share/:postId.svg`: Hono reads that as one parameter NAMED
  // "postId.svg", so `param("postId")` was undefined, D1 refused to bind it, and
  // every share card was a 500.
  const file = c.req.param("file");
  if (!file.endsWith(".svg")) throw new ApiError(404, "Share card not found.");
  const post = await c.env.DB.prepare(
    "SELECT ap.body, p.display_name FROM activity_posts ap JOIN profiles p ON p.user_id = ap.user_id WHERE ap.id = ? AND ap.kind = 'promise_kept'",
  )
    .bind(file.slice(0, -".svg".length))
    .first();
  if (!post) throw new ApiError(404, "Share card not found.");
  // KEPT palette: background, ink, inkMuted, kiwi and kiwiDeep from
  // mobile/constants/theme.ts. It said "NEON RESERVE" in the old dark theme.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#FBFBF4"/><circle cx="180" cy="180" r="92" fill="none" stroke="#EEFBD6" stroke-width="28"/><circle cx="180" cy="180" r="92" fill="none" stroke="#A3E635" stroke-width="28" stroke-linecap="round" transform="rotate(-90 180 180)"/><text x="96" y="378" fill="#0B0F0A" font-family="system-ui" font-size="64" font-weight="700">${escapeXml(String(post.display_name))} kept their promise.</text><text x="96" y="450" fill="#5A6155" font-family="system-ui" font-size="32">${escapeXml(String(post.body ?? "Kept this week’s promise"))} · amount private</text><text x="96" y="550" fill="#4D7C0F" font-family="system-ui" font-size="30" font-weight="800" letter-spacing="4">KEPT</text></svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
});
