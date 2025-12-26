-- Rate limiting tabel voor distributed rate limiting
-- Fixed window approach: één record per user/key met count en reset_at
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  reset_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

-- Index voor snelle lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_key 
  ON rate_limits(user_id, key);

-- SQL functie voor atomic rate limit check
-- Fixed window: reset count als reset_at is verstreken
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_key text,
  p_limit integer,
  p_window_seconds integer
) RETURNS boolean AS $$
DECLARE
  v_current_count integer;
  v_reset_at timestamptz;
  v_allowed boolean;
BEGIN
  -- Atomic upsert met reset logica
  INSERT INTO rate_limits (user_id, key, count, reset_at)
  VALUES (p_user_id, p_key, 1, now() + (p_window_seconds || ' seconds')::interval)
  ON CONFLICT (user_id, key)
  DO UPDATE SET
    count = CASE 
      WHEN rate_limits.reset_at <= now() THEN 1
      ELSE rate_limits.count + 1
    END,
    reset_at = CASE
      WHEN rate_limits.reset_at <= now() THEN now() + (p_window_seconds || ' seconds')::interval
      ELSE rate_limits.reset_at
    END,
    updated_at = now()
  RETURNING count, reset_at INTO v_current_count, v_reset_at;
  
  -- Check of limiet is overschreden
  v_allowed := v_current_count <= p_limit;
  
  -- Cleanup oude entries (ouder dan 2x window)
  DELETE FROM rate_limits
  WHERE reset_at < now() - (p_window_seconds || ' seconds')::interval;
  
  RETURN v_allowed;
END;
$$ LANGUAGE plpgsql;

-- RLS policies voor rate_limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Users kunnen alleen eigen rate limit records zien
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Service role kan alles (voor admin client)
CREATE POLICY "Service role can manage rate limits"
  ON rate_limits FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

