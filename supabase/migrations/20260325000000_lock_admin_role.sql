-- Fix: Prevent admin role self-assignment via signup
-- Only support@daily-guardian.com should be admin (set manually via DB)
-- Previously, handle_new_user() trusted raw_user_meta_data->>'role' from signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
  DECLARE
    v_name TEXT;
  BEGIN
    v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    -- Always assign 'senior' role on signup. Admin role must be set manually via DB.
    INSERT INTO public.profiles (id, user_id, full_name, role)
    VALUES (NEW.id, NEW.id, v_name, 'senior')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.seniors (profile_id, name, phone, timezone, grace_period_minutes)
    VALUES (NEW.id, v_name, '', 'UTC', 120)
    ON CONFLICT DO NOTHING;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user() failed for user %: % %', NEW.id, SQLERRM, SQLSTATE;
      RETURN NEW;
  END;
$$;
