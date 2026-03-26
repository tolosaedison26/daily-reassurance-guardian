-- ================================================================
-- Invite Code System
-- ================================================================

-- 1. Create invite_codes table
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id  UUID        NOT NULL REFERENCES public.seniors(id) ON DELETE CASCADE,
  code       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,          -- NULL = permanent (cleared once a caregiver links)
  used_at    TIMESTAMPTZ,          -- NULL = not yet used
  used_by    UUID        REFERENCES public.profiles(id),
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  UNIQUE(code)
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_senior  ON public.invite_codes(senior_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_active  ON public.invite_codes(code) WHERE is_active = true;

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Seniors can view their own codes
DROP POLICY IF EXISTS "seniors_view_own_codes" ON public.invite_codes;
CREATE POLICY "seniors_view_own_codes" ON public.invite_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.seniors
      WHERE seniors.id = invite_codes.senior_id
        AND seniors.profile_id = auth.uid()
    )
  );


-- 2. generate_invite_code(p_senior_id)
--    Deactivates old unused codes, creates a new one with 7-day expiry.
--    When called via trigger, auth.uid() is NULL so the ownership check is skipped.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_invite_code(p_senior_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code  TEXT;
  v_taken BOOLEAN;
BEGIN
  -- Only the owning senior (or internal calls with no session) may regenerate
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.seniors
      WHERE id = p_senior_id AND profile_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Unauthorized: you can only generate codes for your own account';
    END IF;
  END IF;

  -- Deactivate any existing unused codes for this senior
  UPDATE public.invite_codes
  SET is_active = false
  WHERE senior_id = p_senior_id
    AND is_active = true
    AND used_at IS NULL;

  -- Generate a random 8-char uppercase hex code from a UUID
  LOOP
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.invite_codes WHERE code = v_code) INTO v_taken;
    EXIT WHEN NOT v_taken;
  END LOOP;

  -- Insert with 7-day expiry
  INSERT INTO public.invite_codes (senior_id, code, expires_at)
  VALUES (p_senior_id, v_code, now() + INTERVAL '7 days');

  -- Keep seniors.registration_code in sync for backwards compat
  UPDATE public.seniors SET registration_code = v_code WHERE id = p_senior_id;

  RETURN v_code;
END;
$$;


-- 3. connect_via_invite_code(p_caregiver_id, p_code)
--    Validates the code, marks it as permanently used, and links caregiver → senior.
--    Signature matches existing types.ts definition.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.connect_via_invite_code(p_caregiver_id UUID, p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row             public.invite_codes%ROWTYPE;
  v_senior          public.seniors%ROWTYPE;
  v_caregiver_name  text;
  v_caregiver_phone text;
BEGIN
  -- Caller must be the caregiver they claim to be
  IF auth.uid() IS NOT NULL AND auth.uid() != p_caregiver_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Find an active, matching code
  SELECT * INTO v_row
  FROM public.invite_codes
  WHERE code = upper(trim(p_code))
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code. Check with the senior and try again.');
  END IF;

  -- Already used by someone?
  IF v_row.used_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'This code has already been used to connect an account.');
  END IF;

  -- Expired?
  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    UPDATE public.invite_codes SET is_active = false WHERE id = v_row.id;
    RETURN json_build_object('success', false, 'error', 'This code has expired. Ask the senior to generate a new one from their dashboard.');
  END IF;

  -- Get senior record
  SELECT * INTO v_senior FROM public.seniors WHERE id = v_row.senior_id;

  -- Prevent self-linking
  IF v_senior.profile_id = p_caregiver_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot connect to your own senior account.');
  END IF;

  -- Mark code as permanently used (remove expiry)
  UPDATE public.invite_codes
  SET used_at    = now(),
      used_by    = p_caregiver_id,
      expires_at = NULL
  WHERE id = v_row.id;

  -- Link caregiver → senior in families table
  INSERT INTO public.families (caregiver_id, senior_id)
  VALUES (p_caregiver_id, v_row.senior_id)
  ON CONFLICT DO NOTHING;

  -- Auto-add caregiver as first emergency contact (SECURITY DEFINER bypasses RLS)
  SELECT COALESCE(NULLIF(trim(full_name), ''), 'Caregiver'), COALESCE(phone, '')
    INTO v_caregiver_name, v_caregiver_phone
  FROM public.profiles
  WHERE id = p_caregiver_id
  LIMIT 1;

  -- Only insert if not already a contact (check by name or phone)
  IF NOT EXISTS (
    SELECT 1 FROM public.emergency_contacts
    WHERE senior_id = v_row.senior_id
      AND (
        name = v_caregiver_name
        OR (v_caregiver_phone <> '' AND phone = v_caregiver_phone)
      )
  ) THEN
    -- Shift existing contacts down to make room at position 0
    UPDATE public.emergency_contacts
    SET sort_order = sort_order + 1
    WHERE senior_id = v_row.senior_id;

    -- Insert caregiver as primary contact
    INSERT INTO public.emergency_contacts (senior_id, name, phone, delay_minutes, sort_order, user_id)
    VALUES (
      v_row.senior_id,
      v_caregiver_name,
      v_caregiver_phone,
      0,
      0,
      p_caregiver_id
    );
  END IF;

  RETURN json_build_object(
    'success',     true,
    'senior_id',   v_row.senior_id,
    'senior_name', COALESCE(NULLIF(trim(v_senior.name), ''), 'your loved one')
  );
END;
$$;


-- 4. Trigger: auto-generate invite code when a seniors row is created
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_senior()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.generate_invite_code(NEW.id);
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_senior() failed for senior %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_senior_created ON public.seniors;
CREATE TRIGGER on_senior_created
  AFTER INSERT ON public.seniors
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_senior();


-- 5. Update handle_new_user() to auto-create a seniors row for self-registered seniors
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'senior');
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  -- Create profile row
  INSERT INTO public.profiles (id, user_id, full_name, role)
  VALUES (NEW.id, NEW.id, v_name, v_role)
  ON CONFLICT (id) DO NOTHING;

  -- For seniors, auto-create their seniors record so an invite code is generated
  IF v_role = 'senior' THEN
    INSERT INTO public.seniors (profile_id, name, phone, timezone, grace_period_minutes)
    VALUES (NEW.id, v_name, '', 'UTC', 60)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user() failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;


-- 6. Backfill: generate invite codes for any existing seniors that don't have one
-- ----------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.seniors
    WHERE id NOT IN (
      SELECT DISTINCT senior_id FROM public.invite_codes WHERE is_active = true
    )
  LOOP
    BEGIN
      PERFORM public.generate_invite_code(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backfill failed for senior %: %', r.id, SQLERRM;
    END;
  END LOOP;
END;
$$;
