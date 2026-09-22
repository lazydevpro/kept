import { Hono } from "hono";
import { economics, positionsFor } from "../lib/holdings";
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
 *
 * ── Once anything has been sold ──
 *
 * "Total spend" stops being the cost basis the moment a position is partly
 * disposed of, and unrealised P&L measured against it starts lying. So the
 * figures split in two, both on average cost (see `lib/holdings.ts`):
 *
 *   unrealised = value of what is still held  −  average cost of those units
 *   realised   = what the sales brought in    −  average cost of the units sold
 *
 * A fully sold-out position keeps its row. It holds nothing and has no value,
 * but its realised P&L is real and deleting it would quietly rewrite history.
 */
export const portfolioRoutes = new Hono<{
  Bindings: AppEnv;
  Variables: Variables;
}>();

portfolioRoutes.get("/", async (c) => {
  const userId = c.get("userId");

  const [all, rehearsed] = await Promise.all([
    positionsFor(c.env, userId),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS lots,
              SUM(CAST(COALESCE(input_amount_usdc_base_units, '0') AS INTEGER)) AS cost_base_units
       FROM contributions
       WHERE user_id = ? AND status = 'verified' AND execution_mode = 'sandbox'`,
    )
      .bind(userId)
      .first<{ lots: number; cost_base_units: number | null }>(),
  ]);

  const mints = all.map((position) => position.mint);
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

  const usd = (baseUnits: number) => baseUnits / 1_000_000;

  const positions = all.map((position) => {
    const { basisBase, realisedBase, avgCostPerUnitBase } = economics(position);
    const decimals = position.decimals;
    // Without decimals the base-unit count cannot be turned into a real
    // quantity, so quantity and everything derived from it stay null.
    const toQuantity = (units: bigint) =>
      decimals === null || decimals === undefined
        ? null
        : Number(units) / Math.pow(10, decimals);

    const quantity = toQuantity(position.units);
    const price = quotes?.[position.mint]?.usdPrice ?? null;
    const valueUsd =
      quantity !== null && price !== null ? quantity * price : null;
    const costUsd = usd(basisBase);

    return {
      mint: position.mint,
      symbol: position.symbol ?? "Investment",
      logo: icons[position.mint] ?? "",
      decimals: decimals ?? null,
      baseUnits: position.units.toString(),
      quantity,
      /** Kept for the caller: `lots` has always meant "buys". */
      lots: position.buys,
      sells: position.sells,
      soldQuantity: toQuantity(position.soldUnits),
      open: position.units > 0n,

      costUsd,
      // Average cost of a WHOLE unit of the asset, which is what the screen shows
      // against the live price. `avgCostPerUnitBase` is per base unit of both
      // sides at once and is not a figure anyone can read.
      avgCostUsd: quantity && quantity > 0 ? costUsd / quantity : null,
      priceUsd: price,
      valueUsd,
      pnlUsd: valueUsd === null ? null : valueUsd - costUsd,
      pnlPct:
        valueUsd === null || costUsd === 0
          ? null
          : ((valueUsd - costUsd) / costUsd) * 100,

      proceedsUsd: usd(position.proceedsBase),
      realisedUsd: usd(realisedBase),

      firstAt: position.firstAt,
      lastAt: position.lastAt,
    };
  });

  const open = positions.filter((position) => position.open);
  const costUsd = open.reduce((sum, position) => sum + position.costUsd, 0);
  // Only total the value when EVERY open position is priced. A partial total
  // would read as a portfolio that lost the value of whatever could not be priced.
  const fullyPriced =
    open.length > 0 && open.every((position) => position.valueUsd !== null);
  const valueUsd = fullyPriced
    ? open.reduce((sum, position) => sum + (position.valueUsd ?? 0), 0)
    : null;
  // Realised comes from closed trades, so it is known whether or not anything
  // can be priced today — it is summed across every position, including sold-out ones.
  const realisedUsd = positions.reduce(
    (sum, position) => sum + position.realisedUsd,
    0,
  );

  return c.json({
    portfolio: {
      cluster: String(c.env.SOLANA_CLUSTER),
      priced: quotes !== null,
      pricedAt: quotes !== null ? new Date().toISOString() : null,
      totals: {
        positions: open.length,
        costUsd,
        valueUsd,
        pnlUsd: valueUsd === null ? null : valueUsd - costUsd,
        pnlPct:
          valueUsd === null || costUsd === 0
            ? null
            : ((valueUsd - costUsd) / costUsd) * 100,
        realisedUsd,
      },
      positions,
      // Devnet rehearsals move no money and receive no asset. They are reported
      // separately so they can never be mistaken for holdings.
      rehearsals: {
        lots: Number(rehearsed?.lots ?? 0),
        notionalUsd: usd(Number(rehearsed?.cost_base_units ?? 0)),
      },
    },
  });
});
