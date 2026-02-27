
-- Add escalation settings columns to managed_seniors
ALTER TABLE public.managed_seniors
  ADD COLUMN IF NOT EXISTS escalation_delay_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS escalation_loop_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escalation_911_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_from text NOT NULL DEFAULT '22:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_until text NOT NULL DEFAULT '07:00';
