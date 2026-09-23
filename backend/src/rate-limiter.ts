import { DurableObject } from "cloudflare:workers";
import type { AppEnv } from "./types";

/**
 * One counter per key — an address, or a user and a route — as a Durable Object.
 *
 * ── Why not Cloudflare's Rate Limiting binding ──
 *
 * It was tried first, and on the deployed staging worker it never said no: 100+
 * anonymous sign-ins from one address inside two minutes against a limit of 20,
 * every one a 200, while the same code under `wrangler dev` answered 429 on the
 * 21st. Cloudflare documents the binding as "permissive, eventually consistent"
 * with per-isolate cached counters, and others report it always returning success.
 * A limit that does not limit is worse than none: it reads as protection.
 *
 * A Durable Object is one instance per key, single-threaded, so its count is
 * exact. The cost is a round trip on the routes that use it, which is why only
 * two do: signing in (account creation) and the routes that spend the shared
 * Jupiter key.
 *
 * The window lives in memory. An instance idle long enough to be evicted has, by
 * then, outlived any window it was counting, so nothing is lost that mattered.
 */
export class RateLimiter extends DurableObject<AppEnv> {
  private hits: number[] = [];

  /** Records one hit and says whether it fits inside `limit` per `periodMs`. */
  hit(limit: number, periodMs: number): boolean {
    const now = Date.now();
    this.hits = this.hits.filter((at) => now - at < periodMs);
    if (this.hits.length >= limit) return false;
    this.hits.push(now);
    return true;
  }
}
