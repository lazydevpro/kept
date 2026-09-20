CREATE TRIGGER IF NOT EXISTS profiles_touch_updated_at
AFTER UPDATE ON profiles
BEGIN
  UPDATE profiles SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS goals_touch_updated_at
AFTER UPDATE ON goals
BEGIN
  UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS circles_touch_updated_at
AFTER UPDATE ON circles
BEGIN
  UPDATE circles SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
