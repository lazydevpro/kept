import type { Context, MiddlewareHandler } from "hono";
import type { AppEnv, Variables } from "../types";

type AppContext = Context<{ Bindings: AppEnv; Variables: Variables }>;

/**
 * The two limits worth their round trip. Counted exactly, by `RateLimiter`
 * (src/rate-limiter.ts) — see there for why not Cloudflare's binding.
 *
 *   signup  per address, on sign-in. Anonymous accounts cost nothing to create,
 *           which is the point — and also why one script could otherwise fill the
 *           database with them. Generous enough for a household or an office
 *           behind one address.
 *   quote   per user, on the routes that call Jupiter. Every account shares ONE
 *           key and its per-second allowance, so one client re-quoting in a loop
 *           would starve everyone else.
 */
export const LIMITS = {
  signup: { limit: 20, periodMs: 60_000 },
  quote: { limit: 30, periodMs: 60_000 },
} as const;

type LimitName = keyof typeof LIMITS;

/**
 * Off in the `local` environment: `wrangler dev` and the test suite send every
 * request from one address, and the suite alone signs in dozens of times.
 */
export function rateLimit(
  name: LimitName,
  keyOf: (c: AppContext) => string,
): MiddlewareHandler<{ Bindings: AppEnv; Variables: Variables }> {
  return async (c, next) => {
    if (String(c.env.ENVIRONMENT) !== "local") {
      const { limit, periodMs } = LIMITS[name];
      const counter = c.env.RATE_LIMITER.get(
        c.env.RATE_LIMITER.idFromName(`${name}:${keyOf(c)}`),
      );
      if (!(await counter.hit(limit, periodMs))) {
        return c.json(
          {
            error: {
              code: "rate_limited",
              message: "Too many requests. Wait a moment and try again.",
            },
          },
          429,
          { "retry-after": String(Math.ceil(periodMs / 1000)) },
        );
      }
    }
    await next();
  };
}

export const byIp = (c: AppContext) =>
  `ip:${c.req.header("cf-connecting-ip") ?? "unknown"}`;

export const byUser = (c: AppContext) => `user:${c.get("userId")}`;
