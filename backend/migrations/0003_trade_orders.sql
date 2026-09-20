CREATE TABLE trade_orders (
  request_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  input_mint TEXT NOT NULL,
  output_mint TEXT NOT NULL,
  input_amount TEXT NOT NULL,
  expected_output_amount TEXT NOT NULL,
  output_symbol TEXT NOT NULL,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL,
  executed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX trade_orders_user_idx ON trade_orders(user_id, created_at DESC);
