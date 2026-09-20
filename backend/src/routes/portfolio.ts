import { Hono } from "hono";
import { fetchQuotes } from "../lib/prices";
import { fetchTokenIcons } from "../lib/tokens";
import type { AppEnv, Variables } from "../types";

/**
 * The owner's own portfolio. Private by construction: this route is the only
 * place holdings or P&L are ever computed, it is keyed to the caller's own
 * user id, and nothing here is reachable from the circle endpoints. Circle
 * members continue to see progress only.
 *
 * Holdings come from `verified_amount_base_units` — the real balance delta the
 * verification job read off the confirmed transaction — and never from the
 * submit-time estimate, which is the router's guess and a literal '0' for
 * sandbox rehearsals.
 */
export const portfolioRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

interface PositionRow {
  asset_mint: string;
  asset_symbol: string | null;
  asset_decimals: number | null;
  units: string | null;
  cost_base_units: number | null;
  lots: number;
  first_at: string | null;
  last_at: string | null;
}

portfolioRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  const [live, rehearsed] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT asset_mint,
              MAX(asset_symbol) AS asset_symbol,
              MAX(asset_decimals) AS asset_decimals,
              SUM(CAST(COALESCE(verified_amount_base_units, '0') AS INTEGER)) AS units,
              SUM(CAST(COALESCE(input_amount_usdc_base_units, '0') AS INTEGER)) AS cost_base_units,
              COUNT(*) AS lots,
              MIN(COALESCE(occurred_at, created_at)) AS first_at,
              MAX(COALESCE(occurred_at, created_at)) AS last_at
       FROM contributions
       WHERE user_id = ? AND status = 'verified' AND execution_mode = 'live'
         AND asset_mint IS NOT NULL
       GROUP BY asset_mint
       HAVING units > 0
       ORDER BY cost_base_units DESC`,
    ).bind(userId),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS lots,
              SUM(CAST(COALESCE(input_amount_usdc_base_units, '0') AS INTEGER)) AS cost_base_units
       FROM contributions
       WHERE user_id = ? AND status = 'verified' AND execution_mode = 'sandbox'`,
    ).bind(userId),
  ]);

  const rows = live.results as unknown as PositionRow[];
  const mints = rows.map((row) => row.asset_mint);
  // Prices decide what the portfolio is worth; icons only decide how it looks,
  // so they are fetched alongside rather than in sequence and never block.
  //
  // Pricing is not gated on the cluster: what gets priced is the MINT, and
  // contributions record real mainnet mints whichever cluster the transaction
  // settled on. A mint with no quote degrades that position to cost basis.
  const [quotes, icons] = await Promise.all([
    fetchQuotes(c.env, mints),
    fetchTokenIcons(c.env, mints),
  ]);

  const usd = (baseUnits: number | null) => Number(baseUnits ?? 0) / 1_000_000;

  const positions = rows.map((row) => {
    const costUsd = usd(row.cost_base_units);
    const decimals = row.asset_decimals;
    const rawUnits = String(row.units ?? "0");
    // Without decimals the base-unit count cannot be turned into a real
    // quantity, so quantity and everything derived from it stay null.
    const quantity =
      decimals === null || decimals === undefined
        ? null
        : Number(rawUnits) / Math.pow(10, decimals);
    const price = quotes?.[row.asset_mint]?.usdPrice ?? null;
    const valueUsd =
      quantity !== null && price !== null ? quantity * price : null;

    return {
      mint: row.asset_mint,
      symbol: row.asset_symbol ?? "Investment",
      logo: icons[row.asset_mint] ?? "",
      decimals: decimals ?? null,
      baseUnits: rawUnits,
      quantity,
      lots: Number(row.lots ?? 0),
      costUsd,
      avgCostUsd: quantity && quantity > 0 ? costUsd / quantity : null,
      priceUsd: price,
      valueUsd,
      pnlUsd: valueUsd === null ? null : valueUsd - costUsd,
      pnlPct:
        valueUsd === null || costUsd === 0
          ? null
          : ((valueUsd - costUsd) / costUsd) * 100,
      firstAt: row.first_at,
      lastAt: row.last_at,
    };
  });

  const costUsd = positions.reduce((sum, position) => sum + position.costUsd, 0);
  // Only total the value when EVERY position is priced. A partial total would
  // read as a portfolio that lost the value of whatever could not be priced.
  const fullyPriced =
    positions.length > 0 && positions.every((position) => position.valueUsd !== null);
  const valueUsd = fullyPriced
    ? positions.reduce((sum, position) => sum + (position.valueUsd ?? 0), 0)
    : null;

  const sandbox = (rehearsed.results[0] ?? {}) as Record<string, unknown>;

  return c.json({
    portfolio: {
      cluster: String(c.env.SOLANA_CLUSTER),
      priced: quotes !== null,
      pricedAt: quotes !== null ? new Date().toISOString() : null,
      totals: {
        positions: positions.length,
        costUsd,
        valueUsd,
        pnlUsd: valueUsd === null ? null : valueUsd - costUsd,
        pnlPct:
          valueUsd === null || costUsd === 0
            ? null
            : ((valueUsd - costUsd) / costUsd) * 100,
      },
      positions,
      // Devnet rehearsals move no money and receive no asset. They are reported
      // separately so they can never be mistaken for holdings.
      rehearsals: {
        lots: Number(sandbox.lots ?? 0),
        notionalUsd: usd(Number(sandbox.cost_base_units ?? 0)),
      },
    },
  });
});
