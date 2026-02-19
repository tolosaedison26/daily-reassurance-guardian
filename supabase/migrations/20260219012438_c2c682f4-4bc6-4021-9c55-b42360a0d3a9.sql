-- Function to find seniors who missed their check-in window
CREATE OR REPLACE FUNCTION public.get_missed_checkin_seniors()
RETURNS TABLE (senior_id UUID, full_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id AS senior_id, p.full_name
  FROM profiles p
  JOIN reminder_settings rs ON rs.senior_id = p.user_id
  WHERE p.role = 'senior'
    -- Grace period has passed: current time > reminder_time + grace_period_hours
    AND (CURRENT_TIME AT TIME ZONE 'UTC') > (rs.reminder_time + (rs.grace_period_hours * INTERVAL '1 hour'))
    -- Not yet checked in today
    AND NOT EXISTS (
      SELECT 1 FROM daily_check_ins dc
      WHERE dc.senior_id = p.user_id
        AND dc.check_date = CURRENT_DATE
    )
    -- Has at least one active caregiver connection
    AND EXISTS (
      SELECT 1 FROM senior_connections sc
      WHERE sc.senior_id = p.user_id AND sc.status = 'active'
    );
END;
$$;