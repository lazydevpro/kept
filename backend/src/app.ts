import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./auth";
import { jsonError } from "./lib/http";
import { authenticated } from "./middleware/authenticated";
import { circleRoutes, inviteRoutes, liveRoutes } from "./routes/circles";
import { contributionRoutes } from "./routes/contributions";
import { goalRoutes } from "./routes/goals";
import { mediaRoutes } from "./routes/media";
import { portfolioRoutes } from "./routes/portfolio";
import { profileRoutes } from "./routes/profile";
import { walletRoutes } from "./routes/wallets";
import { widgetRoutes } from "./routes/widget";
import { tradeRoutes } from "./routes/trades";
import type { AppEnv, Variables } from "./types";

export const app = new Hono<{ Bindings: AppEnv; Variables: Variables }>();

/**
 * The Expo web export runs on http://localhost:<port>, so `npm run dev` + `expo start --web`
 * could never authenticate against the local Worker. Allowed only when ENVIRONMENT is
 * "local"; staging and production keep the strict origin check.
 */
const LOCAL_WEB_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use("*", async (c, next) => {
  const allowsLocalWeb = String(c.env.ENVIRONMENT) === "local";
  const middleware = cors({
    origin: (origin) =>
      origin === c.env.APP_ORIGIN ||
      origin.startsWith("exp://") ||
      (allowsLocalWeb && LOCAL_WEB_ORIGIN.test(origin))
        ? origin
        : c.env.APP_ORIGIN,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["set-auth-token"],
  });
  return middleware(c, next);
});

app.get("/", (c) =>
  c.json({
    service: "neon-reserve-api",
    status: "ok",
    environment: c.env.ENVIRONMENT,
  }),
);
app.get("/health", (c) => c.json({ ok: true, at: new Date().toISOString() }));
app.on(["GET", "POST"], "/api/auth/*", (c) =>
  createAuth(c.env, c.req.url).handler(c.req.raw),
);
app.route("/v1/media", mediaRoutes);
app.route("/v1/invites", inviteRoutes);
app.route("/v1/live", liveRoutes);

app.use("/v1/*", authenticated);
app.route("/v1", profileRoutes);
app.route("/v1/goals", goalRoutes);
app.route("/v1/circles", circleRoutes);
app.route("/v1/wallets", walletRoutes);
app.route("/v1/contributions", contributionRoutes);
app.route("/v1/widget", widgetRoutes);
app.route("/v1/portfolio", portfolioRoutes);
app.route("/v1/trades", tradeRoutes);

app.notFound((c) =>
  c.json({ error: { code: "not_found", message: "Route not found." } }, 404),
);
app.onError((error, c) => jsonError(c, error));
