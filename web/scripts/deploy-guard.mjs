/*
 * Matches `backend/scripts/deploy-guard.mjs`. No Cloudflare account is connected to this repo,
 * so `wrangler deploy` here would either fail confusingly or publish to whatever account
 * happens to be logged in. Serve the built output locally with `npm run preview` instead —
 * that runs the real Workers Assets runtime against `out/`.
 */
throw new Error(
  'Remote deployment is intentionally disabled. Once a Cloudflare account is connected, replace this guard with `wrangler deploy` and point a route at it.',
)
