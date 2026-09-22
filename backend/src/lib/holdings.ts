import type { AppEnv } from "../types";

/**
 * What a user actually holds, per mint, netting sells against buys.
 *
 * One implementation, because there are now two callers that must agree: the
 * portfolio screen, and the sell route's "do you own this much" check. If those
 * ever disagree the app either offers to sell something the reader does not have,
 * or refuses a sell it just told them they could make.
 *
 * Base units are `bigint` throughout. A 9-decimal token with a four-figure
 * position is comfortably past 2^53, and `SUM()` in SQLite returns a float once
 * it overflows an integer — which silently rounds the low digits of a balance.
 * The SQL below sums as text-free integers and the values are parsed here.
 */

export interface Position {
  mint: string;
  symbol: string | null;
  decimals: number | null;
  /** Units ever bought, and units ever sold. Remaining is the difference. */
  boughtUnits: bigint;
  soldUnits: bigint;
  units: bigint;
  /** USDC base units spent on buys, and received from sells. */
  costBase: number;
  proceedsBase: number;
  buys: number;
  sells: number;
  firstAt: string | null;
  lastAt: string | null;
}

interface Row {
  asset_mint: string;
  asset_symbol: string | null;
  asset_decimals: number | null;
  bought_units: string | null;
  sold_units: string | null;
  cost_base: number | null;
  proceeds_base: number | null;
  buys: number;
  sells: number;
  first_at: string | null;
  last_at: string | null;
}

/**
 * Only `verified` and only `live`. A pending row is a claim the chain has not
 * confirmed, and a sandbox rehearsal received no asset at all — counting either
 * as a holding would let someone sell something they do not own.
 */
const SELECT = `
  SELECT asset_mint,
         MAX(asset_symbol) AS asset_symbol,
         MAX(asset_decimals) AS asset_decimals,
         CAST(SUM(CASE WHEN direction = 'buy'
                       THEN CAST(COALESCE(verified_amount_base_units, '0') AS INTEGER)
                       ELSE 0 END) AS TEXT) AS bought_units,
         CAST(SUM(CASE WHEN direction = 'sell'
                       THEN CAST(COALESCE(verified_amount_base_units, '0') AS INTEGER)
                       ELSE 0 END) AS TEXT) AS sold_units,
         SUM(CASE WHEN direction = 'buy'
                  THEN CAST(COALESCE(input_amount_usdc_base_units, '0') AS INTEGER)
                  ELSE 0 END) AS cost_base,
         SUM(CASE WHEN direction = 'sell'
                  THEN CAST(COALESCE(input_amount_usdc_base_units, '0') AS INTEGER)
                  ELSE 0 END) AS proceeds_base,
         SUM(CASE WHEN direction = 'buy' THEN 1 ELSE 0 END) AS buys,
         SUM(CASE WHEN direction = 'sell' THEN 1 ELSE 0 END) AS sells,
         MIN(COALESCE(occurred_at, created_at)) AS first_at,
         MAX(COALESCE(occurred_at, created_at)) AS last_at
  FROM contributions
  WHERE user_id = ? AND status = 'verified' AND execution_mode = 'live'
    AND asset_mint IS NOT NULL`;

const toPosition = (row: Row): Position => {
  const boughtUnits = BigInt(row.bought_units ?? "0");
  const soldUnits = BigInt(row.sold_units ?? "0");
  return {
    mint: row.asset_mint,
    symbol: row.asset_symbol,
    decimals: row.asset_decimals,
    boughtUnits,
    soldUnits,
    units: boughtUnits - soldUnits,
    costBase: Number(row.cost_base ?? 0),
    proceedsBase: Number(row.proceeds_base ?? 0),
    buys: Number(row.buys ?? 0),
    sells: Number(row.sells ?? 0),
    firstAt: row.first_at,
    lastAt: row.last_at,
  };
};

/**
 * Every mint the user has ever touched, including ones sold down to zero —
 * a fully-closed position still has realised P&L worth showing. Callers that
 * only want current holdings filter on `units > 0n`.
 */
export async function positionsFor(
  env: AppEnv,
  userId: string,
): Promise<Position[]> {
  const result = await env.DB.prepare(
    `${SELECT} GROUP BY asset_mint ORDER BY cost_base DESC`,
  )
    .bind(userId)
    .all<Row>();
  return result.results.map(toPosition);
}

/** The same figures for one mint, for the sell route's sufficiency check. */
export async function positionFor(
  env: AppEnv,
  userId: string,
  mint: string,
): Promise<Position | null> {
  const row = await env.DB.prepare(
    `${SELECT} AND asset_mint = ? GROUP BY asset_mint`,
  )
    .bind(userId, mint)
    .first<Row>();
  return row ? toPosition(row) : null;
}

/**
 * Average cost, and what a sale of `soldUnits` realised against it.
 *
 * Average rather than FIFO: the product buys the same asset on a weekly schedule,
 * which is precisely the case where FIFO's per-lot bookkeeping changes the answer
 * least and costs the most to get right.
 */
export function economics(position: Position) {
  const bought = Number(position.boughtUnits);
  const sold = Number(position.soldUnits);
  const avgCostPerUnitBase = bought > 0 ? position.costBase / bought : 0;
  return {
    /** Cost of what is still held — not total spend, once something has been sold. */
    basisBase: avgCostPerUnitBase * Number(position.units),
    /** Locked in: proceeds minus the average cost of the units that produced them. */
    realisedBase: position.proceedsBase - avgCostPerUnitBase * sold,
    avgCostPerUnitBase,
  };
}
