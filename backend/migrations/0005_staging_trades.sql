ALTER TABLE trade_orders ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'live';
ALTER TABLE trade_orders ADD COLUMN verification_reference TEXT;

ALTER TABLE contributions ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'live';
ALTER TABLE contributions ADD COLUMN input_amount_usdc_base_units TEXT;
ALTER TABLE contributions ADD COLUMN verification_reference TEXT;

CREATE INDEX trade_orders_mode_idx ON trade_orders(execution_mode, created_at DESC);
CREATE INDEX contributions_mode_idx ON contributions(execution_mode, status);
