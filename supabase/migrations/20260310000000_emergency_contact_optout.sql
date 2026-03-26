-- Add opt-out and notification tracking to emergency_contacts
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS opted_out boolean DEFAULT false;
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS opted_out_at timestamptz;
ALTER TABLE emergency_contacts ADD COLUMN IF NOT EXISTS notified_at timestamptz;
