-- Invite codes table
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  senior_id UUID NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Seniors can view their own codes
CREATE POLICY "Seniors can view own invite codes"
ON public.invite_codes FOR SELECT
USING (auth.uid() = senior_id);

-- Generate a unique invite code for a senior (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.generate_invite_code(p_senior_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_exists BOOLEAN;
BEGIN
  -- Check caller is the senior themselves
  IF auth.uid() != p_senior_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Deactivate existing codes
  UPDATE invite_codes SET is_active = false
  WHERE senior_id = p_senior_id AND is_active = true;

  -- Generate a unique XXXX-NNNN code
  LOOP
    v_code := '';
    FOR i IN 1..4 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    v_code := v_code || '-';
    FOR i IN 1..4 LOOP
      v_code := v_code || floor(random() * 10)::text;
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM invite_codes WHERE code = v_code AND is_active = true) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  INSERT INTO invite_codes (senior_id, code, expires_at)
  VALUES (p_senior_id, v_code, now() + interval '7 days');

  RETURN v_code;
END;
$$;

-- Connect a caregiver to a senior via invite code
CREATE OR REPLACE FUNCTION public.connect_via_invite_code(p_code TEXT, p_caregiver_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_senior_id UUID;
BEGIN
  -- Check caller is the caregiver themselves
  IF auth.uid() != p_caregiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Find valid active code
  SELECT senior_id INTO v_senior_id
  FROM invite_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND expires_at > now();

  IF v_senior_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code. Ask your loved one for a new one.');
  END IF;

  IF v_senior_id = p_caregiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot connect to yourself.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM senior_connections
    WHERE caregiver_id = p_caregiver_id AND senior_id = v_senior_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already connected to this person.');
  END IF;

  INSERT INTO senior_connections (caregiver_id, senior_id, status)
  VALUES (p_caregiver_id, v_senior_id, 'active');

  RETURN jsonb_build_object('success', true);
END;
$$;