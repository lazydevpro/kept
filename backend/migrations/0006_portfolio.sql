-- Portfolio support.
--
-- `amount_base_units` is written at submit time from what the router *said* it
-- would deliver, and is the literal string '0' for sandbox rehearsals. Neither is
-- a safe basis for holdings. These two columns are filled by the verification job
-- from the confirmed transaction instead: the real balance delta on the linked
-- wallet, and the mint's own decimals, both already present in the RPC response.
ALTER TABLE contributions ADD COLUMN verified_amount_base_units TEXT;
ALTER TABLE contributions ADD COLUMN asset_decimals INTEGER;

-- Portfolio reads group verified live contributions by mint.
CREATE INDEX contributions_portfolio_idx
  ON contributions(user_id, execution_mode, status, asset_mint);
