-- Nudges: one member reminding another that their week is still open.
--
-- Recorded rather than fired-and-forgotten for two reasons. The UNIQUE key is
-- the rate limit — one nudge per person per week, so a circle cannot become a
-- place people get poked repeatedly — and the row is what the "First nudge" and
-- "Good neighbour" awards are counted from.
CREATE TABLE nudges (
  id TEXT PRIMARY KEY,
  circle_id TEXT NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  from_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  week_start TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_user_id, to_user_id, week_start)
);

CREATE INDEX nudges_from_idx ON nudges(from_user_id);
CREATE INDEX nudges_to_idx ON nudges(to_user_id, week_start);
