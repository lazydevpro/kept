-- Lets the nightly backfill find contributions verified before migration 0006,
-- which have no `verified_amount_base_units` and so cannot appear in holdings.
--
-- Stamped on every attempt, success or give-up, so a transaction the RPC can no
-- longer serve is tried once rather than re-queued every night forever.
ALTER TABLE contributions ADD COLUMN holdings_checked_at TEXT;

CREATE INDEX contributions_backfill_idx
  ON contributions(status, execution_mode, holdings_checked_at);
