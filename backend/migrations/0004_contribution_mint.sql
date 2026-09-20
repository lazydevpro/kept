ALTER TABLE contributions ADD COLUMN asset_mint TEXT;
CREATE INDEX contributions_asset_mint_idx ON contributions(asset_mint);
