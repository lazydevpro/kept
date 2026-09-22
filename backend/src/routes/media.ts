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

mediaRoutes.get("/share/:postId.svg", async (c) => {
  const post = await c.env.DB.prepare(
    "SELECT ap.body, p.display_name FROM activity_posts ap JOIN profiles p ON p.user_id = ap.user_id WHERE ap.id = ?",
  )
    .bind(c.req.param("postId"))
    .first();
  if (!post) throw new ApiError(404, "Share card not found.");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9FEF7B"/><stop offset="1" stop-color="#0CBB79"/></linearGradient></defs><rect width="1200" height="630" rx="48" fill="#090D15"/><circle cx="180" cy="180" r="92" fill="none" stroke="#232C38" stroke-width="28"/><path d="M180 88 A92 92 0 1 1 90 200" fill="none" stroke="url(#p)" stroke-width="28" stroke-linecap="round"/><text x="96" y="378" fill="#F4F5F6" font-family="system-ui" font-size="64" font-weight="700">${escapeXml(String(post.display_name))} showed up.</text><text x="96" y="450" fill="#A5B1C0" font-family="system-ui" font-size="32">${escapeXml(String(post.body ?? "Promise kept"))} · amount private</text><text x="96" y="550" fill="#9FEF7B" font-family="system-ui" font-size="26" font-weight="700">NEON RESERVE</text></svg>`;
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400",
    },
  });
});
