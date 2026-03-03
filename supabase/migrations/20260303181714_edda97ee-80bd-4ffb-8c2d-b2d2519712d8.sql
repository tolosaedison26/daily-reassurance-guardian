CREATE OR REPLACE FUNCTION public.connect_via_invite_code(p_code text, p_caregiver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_senior_id UUID;
BEGIN
  IF auth.uid() != p_caregiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Case-insensitive lookup, no expiry or status filter
  SELECT senior_id INTO v_senior_id
  FROM invite_codes
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code));

  IF v_senior_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code not found. Double-check the code and try again.');
  END IF;

  IF v_senior_id = p_caregiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You cannot connect to yourself.');
  END IF;

  IF EXISTS (
    SELECT 1 FROM senior_connections
    WHERE caregiver_id = p_caregiver_id AND senior_id = v_senior_id
  ) THEN
    RETURN jsonb_build_object('success', true);
  END IF;

  INSERT INTO senior_connections (caregiver_id, senior_id, status)
  VALUES (p_caregiver_id, v_senior_id, 'active');

  RETURN jsonb_build_object('success', true);
END;
$function$;