-- Selling a position back to USDC.
--
-- A sell lands in `contributions` alongside buys rather than in a table of its own,
-- because holdings are the running sum of both and splitting them means every read
-- joins two tables and every new query is a chance to forget one.
--
-- The column conventions for a sell row, which nothing else makes obvious:
--
--   direction                     'sell'
--   verified_amount_base_units    asset units DISPOSED OF, stored POSITIVE.
--                                 The sign lives in `direction`, not in the number —
--                                 a negative here would silently corrupt the buy-side
--                                 backfill in jobs.ts, which stores whatever delta the
--                                 chain reports.
--   input_amount_usdc_base_units  USDC RECEIVED. On a buy this column is what was
--                                 spent; on a sell it is what came back.
--   asset_mint / asset_symbol / asset_decimals   the asset sold, as for a buy.
--
-- A sell never closes a weekly promise and never posts to a circle feed. Keeping a
-- promise means putting money in; taking it out is nobody else's business and is not
-- an achievement. `jobs.ts` branches on `direction` for exactly this.
--
-- Cost basis is AVERAGE COST, computed in routes/portfolio.ts:
--   avg        = total bought cost / total bought units
--   remaining  = bought units - sold units
--   basis      = avg * remaining
--   realised   = proceeds - (avg * sold units)
-- Average rather than FIFO because the product buys the same asset on a schedule,
-- which is the case where FIFO's extra bookkeeping buys nothing.

ALTER TABLE contributions
  ADD COLUMN direction TEXT NOT NULL DEFAULT 'buy' CHECK (direction IN ('buy', 'sell'));

ALTER TABLE trade_orders
  ADD COLUMN direction TEXT NOT NULL DEFAULT 'buy' CHECK (direction IN ('buy', 'sell'));

-- On a sell the asset is the INPUT mint and `output_symbol` is USDC, so neither of the
-- existing columns answers "which asset is this order about". These always do, for both
-- directions.
ALTER TABLE trade_orders ADD COLUMN asset_mint TEXT;
ALTER TABLE trade_orders ADD COLUMN asset_symbol TEXT;

-- Portfolio reads group by mint and split on direction.
CREATE INDEX contributions_direction_idx
  ON contributions(user_id, execution_mode, status, asset_mint, direction);
