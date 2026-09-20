-- Stops the weekly reminder firing on every cron run.
--
-- The cron is daily and the reminder window is "due within two days", so an
-- un-kept promise matched on two consecutive nights and the same nudge went out
-- twice. Stamped when a reminder is queued, and cleared for the new week because
-- each week gets its own weekly_promises row.
ALTER TABLE weekly_promises ADD COLUMN reminded_at TEXT;

CREATE INDEX weekly_promises_reminder_idx
  ON weekly_promises(completed_at, reminded_at, due_at);
