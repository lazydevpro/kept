import type { AppEnv } from "../types";

/**
 * Token records by mint, from Jupiter.
 *
 * Two callers with different appetites. The portfolio only stores a mint and a
 * symbol — it never sees the asset catalog — so it wants artwork and nothing
 * else; walking the xStocks catalog for a logo would make a cold portfolio read
 * pay for ten upstream pages. The buy ticket wants the whole record: decimals,
 * liquidity, holders, and how the price has moved across four windows.
 *
 * One keyless call serves both, comma-separated mints. Everything here is
 * decoration or context around a decision — a failure returns fewer tokens,
 * never an error.
 */

const KEYED_URL = "https://api.jup.ag/tokens/v2/search";
const FREE_URL = "https://lite-api.jup.ag/tokens/v2/search";
/** Same cap the price lookup uses; the query is a URL, not a body. */
const IDS_PER_REQUEST = 50;
const TIMEOUT_MS = 4000;

interface JupiterWindow {
  priceChange?: number;
  buyVolume?: number;
  sellVolume?: number;
}

export interface JupiterToken {
  id?: string;
  symbol?: string;
  name?: string;
  icon?: string;
  decimals?: number;
  usdPrice?: number;
  liquidity?: number;
  mcap?: number;
  fdv?: number;
  holderCount?: number;
  circSupply?: number;
  isVerified?: boolean;
  organicScoreLabel?: string;
  stats5m?: JupiterWindow;
  stats1h?: JupiterWindow;
  stats6h?: JupiterWindow;
  stats24h?: JupiterWindow;
}

export async function fetchTokens(env: AppEnv, mints: string[]): Promise<Record<string, JupiterToken>> {
  const unique = [...new Set(mints)].filter(Boolean);
  if (!unique.length) return {};

  const keyed = Boolean(env.JUPITER_API_KEY);
  const tokens: Record<string, JupiterToken> = {};

  for (let start = 0; start < unique.length; start += IDS_PER_REQUEST) {
    const chunk = unique.slice(start, start + IDS_PER_REQUEST);
    try {
      const response = await fetch(`${keyed ? KEYED_URL : FREE_URL}?query=${chunk.join(",")}`, {
        headers: keyed ? { "x-api-key": env.JUPITER_API_KEY as string } : {},
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const found = (Array.isArray(payload) ? payload : []) as JupiterToken[];
      for (const token of found) {
        if (token.id) tokens[token.id] = token;
      }
    } catch {
      // One bad chunk should not lose the tokens we already have.
    }
  }

  return tokens;
}

export async function fetchTokenIcons(env: AppEnv, mints: string[]): Promise<Record<string, string>> {
  const tokens = await fetchTokens(env, mints);
  const icons: Record<string, string> = {};
  for (const [mint, token] of Object.entries(tokens)) {
    if (token.icon) icons[mint] = token.icon;
  }
  return icons;
}
