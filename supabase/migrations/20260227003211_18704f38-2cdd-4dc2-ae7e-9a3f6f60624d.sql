
-- Table for caregiver-created senior profiles (managed seniors)
CREATE TABLE public.managed_seniors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  date_of_birth DATE,
  notes TEXT,
  reminder_hour TEXT NOT NULL DEFAULT '08',
  reminder_minute TEXT NOT NULL DEFAULT '00',
  reminder_period TEXT NOT NULL DEFAULT 'AM',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  grace_period_minutes INTEGER NOT NULL DEFAULT 60,
  frequency TEXT NOT NULL DEFAULT 'daily',
  custom_days TEXT[] DEFAULT '{}',
  mood_check_enabled BOOLEAN NOT NULL DEFAULT true,
  vacation_mode BOOLEAN NOT NULL DEFAULT false,
  vacation_from DATE,
  vacation_until DATE,
  claimed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.managed_seniors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view own managed seniors"
  ON public.managed_seniors FOR SELECT
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can insert managed seniors"
  ON public.managed_seniors FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can update own managed seniors"
  ON public.managed_seniors FOR UPDATE
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can delete own managed seniors"
  ON public.managed_seniors FOR DELETE
  USING (auth.uid() = caregiver_id);

-- Emergency contacts for managed seniors
CREATE TABLE public.managed_senior_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  managed_senior_id UUID NOT NULL REFERENCES public.managed_seniors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT,
  email TEXT,
  notify_via_sms BOOLEAN NOT NULL DEFAULT true,
  notify_via_email BOOLEAN NOT NULL DEFAULT false,
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.managed_senior_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can manage contacts of own managed seniors"
  ON public.managed_senior_contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.managed_seniors ms
      WHERE ms.id = managed_senior_contacts.managed_senior_id
        AND ms.caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.managed_seniors ms
      WHERE ms.id = managed_senior_contacts.managed_senior_id
        AND ms.caregiver_id = auth.uid()
    )
  );

-- Trigger for updated_at on managed_seniors
CREATE TRIGGER update_managed_seniors_updated_at
  BEFORE UPDATE ON public.managed_seniors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
