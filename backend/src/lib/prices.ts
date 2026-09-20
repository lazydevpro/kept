import type { AppEnv } from "../types";

/**
 * Live USD prices from Jupiter.
 *
 * Shared by the portfolio and the asset catalog so the two can never disagree
 * about what something is worth.
 *
 * No wallet and no key are required: without JUPITER_API_KEY this uses the free
 * tier, which is rate limited but fine for per-user reads. A key raises the
 * limits and is the same endpoint otherwise.
 */

const KEYED_URL = "https://api.jup.ag/price/v3";
const FREE_URL = "https://lite-api.jup.ag/price/v3";
/** Jupiter caps the `ids` list; stay well under it. */
const IDS_PER_REQUEST = 50;
const TIMEOUT_MS = 4000;

export interface Quote {
  usdPrice: number;
  priceChange24h: number | null;
}

interface JupiterQuote {
  usdPrice?: number;
  priceChange24h?: number;
}

/**
 * Returns a quote per mint that had one. Mints without a price are simply
 * absent — callers must treat a miss as "unknown", never as zero.
 *
 * Returns null only when the price service itself could not be reached, so a
 * caller can tell "no price for this asset" from "pricing is down".
 */
export async function fetchQuotes(
  env: AppEnv,
  mints: string[],
): Promise<Record<string, Quote> | null> {
  const unique = [...new Set(mints)].filter(Boolean);
  if (!unique.length) return {};

  const keyed = Boolean(env.JUPITER_API_KEY);
  const quotes: Record<string, Quote> = {};
  let reached = false;

  for (let start = 0; start < unique.length; start += IDS_PER_REQUEST) {
    const chunk = unique.slice(start, start + IDS_PER_REQUEST);
    try {
      const response = await fetch(
        `${keyed ? KEYED_URL : FREE_URL}?ids=${chunk.join(",")}`,
        {
          headers: keyed ? { "x-api-key": env.JUPITER_API_KEY as string } : {},
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );
      if (!response.ok) continue;
      reached = true;
      const payload = (await response.json()) as Record<string, JupiterQuote | undefined>;
      for (const mint of chunk) {
        const price = payload[mint]?.usdPrice;
        if (typeof price === "number" && Number.isFinite(price)) {
          const change = payload[mint]?.priceChange24h;
          quotes[mint] = {
            usdPrice: price,
            priceChange24h: typeof change === "number" && Number.isFinite(change) ? change : null,
          };
        }
      }
    } catch {
      // One bad chunk should not lose the prices we already have.
    }
  }

  return reached ? quotes : null;
}
