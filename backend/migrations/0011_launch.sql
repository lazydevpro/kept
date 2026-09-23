-- Launch readiness.
--
-- 1. Terms and eligibility, recorded per account.
--
--    `terms_version` is the version the reader agreed to, not a boolean, so a
--    material change to the terms can ask again without a migration: raise
--    TERMS_VERSION in src/lib/terms.ts and everyone below it is asked on their
--    next purchase. Selling never asks — getting money out must not be gated.
ALTER TABLE profiles ADD COLUMN terms_version INTEGER;
ALTER TABLE profiles ADD COLUMN terms_accepted_at TEXT;

-- 2. The pending sweeper (`sweepPendingContributions` in src/jobs.ts) reads
--    pending rows by age every few minutes. Without this it scans the table.
CREATE INDEX contributions_pending_idx
  ON contributions(status, created_at);

-- 3. Every anonymous account was named "Anonymous" — the auth plugin's placeholder,
--    copied into the profile. Give existing ones the same distinguishable default new
--    accounts now get (src/middleware/authenticated.ts).
UPDATE profiles
  SET display_name = 'Member ' || upper(substr(user_id, -4))
  WHERE display_name = 'Anonymous';
