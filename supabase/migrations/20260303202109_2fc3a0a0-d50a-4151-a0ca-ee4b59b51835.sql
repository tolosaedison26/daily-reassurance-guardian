
-- ============================================================
-- 1. SENIORS table (no cross-table RLS yet)
-- ============================================================
CREATE TABLE public.seniors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  relationship TEXT,
  date_of_birth DATE,
  notes TEXT,
  registration_code TEXT,
  reminder_hour TEXT NOT NULL DEFAULT '08',
  reminder_minute TEXT NOT NULL DEFAULT '00',
  reminder_period TEXT NOT NULL DEFAULT 'AM',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  grace_period_minutes INTEGER NOT NULL DEFAULT 60,
  frequency TEXT NOT NULL DEFAULT 'daily',
  custom_days TEXT[] DEFAULT '{}'::TEXT[],
  mood_check_enabled BOOLEAN NOT NULL DEFAULT true,
  vacation_mode BOOLEAN NOT NULL DEFAULT false,
  vacation_from DATE,
  vacation_until DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.seniors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage own seniors"
  ON public.seniors FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Seniors can view own record"
  ON public.seniors FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. FAMILIES table
-- ============================================================
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL,
  senior_id UUID NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (caregiver_id, senior_id)
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can insert own links"
  ON public.families FOR INSERT
  WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can view own links"
  ON public.families FOR SELECT
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can delete own links"
  ON public.families FOR DELETE
  USING (auth.uid() = caregiver_id);

-- Now add cross-reference policy on seniors
CREATE POLICY "Linked caregivers can view seniors"
  ON public.seniors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = seniors.id AND f.caregiver_id = auth.uid()
  ));

-- ============================================================
-- 3. CHECK_INS table
-- ============================================================
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  mood TEXT,
  note TEXT,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (senior_id, check_date)
);

ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Linked caregivers can view check_ins"
  ON public.check_ins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = check_ins.senior_id AND f.caregiver_id = auth.uid()
  ));

CREATE POLICY "Linked caregivers can manage check_ins"
  ON public.check_ins FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = check_ins.senior_id AND f.caregiver_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = check_ins.senior_id AND f.caregiver_id = auth.uid()
  ));

CREATE POLICY "Seniors can manage own check_ins"
  ON public.check_ins FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.seniors s
    WHERE s.id = check_ins.senior_id AND s.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.seniors s
    WHERE s.id = check_ins.senior_id AND s.user_id = auth.uid()
  ));

-- ============================================================
-- 4. ALERTS table
-- ============================================================
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'missed',
  message TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Linked caregivers can view alerts"
  ON public.alerts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = alerts.senior_id AND f.caregiver_id = auth.uid()
  ));

CREATE POLICY "Linked caregivers can manage alerts"
  ON public.alerts FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = alerts.senior_id AND f.caregiver_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.families f
    WHERE f.senior_id = alerts.senior_id AND f.caregiver_id = auth.uid()
  ));

-- ============================================================
-- 5. Update emergency_contacts to reference seniors
-- ============================================================
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS senior_id UUID REFERENCES public.seniors(id) ON DELETE CASCADE;
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS notify_via_sms BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS notify_via_email BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.emergency_contacts ADD COLUMN IF NOT EXISTS delay_minutes INTEGER NOT NULL DEFAULT 0;

CREATE POLICY "Linked caregivers can manage emergency_contacts"
  ON public.emergency_contacts FOR ALL
  USING (
    senior_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.senior_id = emergency_contacts.senior_id AND f.caregiver_id = auth.uid()
    )
  )
  WITH CHECK (
    senior_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.families f
      WHERE f.senior_id = emergency_contacts.senior_id AND f.caregiver_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Updated connect_via_invite_code
-- ============================================================
CREATE OR REPLACE FUNCTION public.connect_via_invite_code(p_code text, p_caregiver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_senior_id UUID;
  v_senior_name TEXT;
BEGIN
  IF auth.uid() != p_caregiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT id, first_name || ' ' || last_name INTO v_senior_id, v_senior_name
  FROM seniors
  WHERE UPPER(TRIM(registration_code)) = UPPER(TRIM(p_code))
  LIMIT 1;

  IF v_senior_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code not found. Double-check the code and try again.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM families
    WHERE caregiver_id = p_caregiver_id AND senior_id = v_senior_id
  ) THEN
    RETURN jsonb_build_object('success', true, 'senior_name', v_senior_name, 'senior_id', v_senior_id);
  END IF;

  INSERT INTO families (caregiver_id, senior_id)
  VALUES (p_caregiver_id, v_senior_id);

  RETURN jsonb_build_object('success', true, 'senior_name', v_senior_name, 'senior_id', v_senior_id);
END;
$function$;

-- ============================================================
-- 7. Updated generate_invite_code
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invite_code(p_senior_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_code TEXT;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_exists BOOLEAN;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..4 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    v_code := v_code || '-';
    FOR i IN 1..4 LOOP
      v_code := v_code || floor(random() * 10)::text;
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM seniors WHERE registration_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  UPDATE seniors SET registration_code = v_code WHERE id = p_senior_id;
  RETURN v_code;
END;
$function$;

-- ============================================================
-- 8. Update caregiver_notes to reference seniors
-- ============================================================
ALTER TABLE public.caregiver_notes ADD COLUMN IF NOT EXISTS senior_id UUID REFERENCES public.seniors(id) ON DELETE CASCADE;

-- ============================================================
-- 9. Trigger for updated_at
-- ============================================================
CREATE TRIGGER update_seniors_updated_at
  BEFORE UPDATE ON public.seniors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
