-- DEBUG SIGNUP ISSUES
-- This script creates a table to log trigger errors and updates the trigger to be "fail-safe".
-- It will allow the user to be created even if the profile insert fails, so we can debug.

-- 1. Create error log table (public so we can query it easily)
CREATE TABLE IF NOT EXISTS public.trigger_errors (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email text,
    error_message text,
    error_detail text,
    created_at timestamptz DEFAULT now()
);

-- Allow public read access to this table for debugging
ALTER TABLE public.trigger_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view errors" ON public.trigger_errors FOR SELECT USING (true);

-- 2. Create a "Fail-Safe" Trigger Function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'member';
  v_tenant_id uuid;
BEGIN
  ---------------------------------------------------------------------------
  -- Attempt to parse metadata safely
  ---------------------------------------------------------------------------
  BEGIN
    IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
      v_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'member'; -- Default on error
  END;

  BEGIN
    IF NEW.raw_user_meta_data ->> 'tenant_id' IS NOT NULL THEN
      v_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL; -- Default on error
  END;

  ---------------------------------------------------------------------------
  -- Main Insert Attempt
  ---------------------------------------------------------------------------
  BEGIN
    INSERT INTO public.users_profile (id, email, full_name, role, tenant_id)
    VALUES (
      NEW.id, 
      NEW.email, 
      NEW.raw_user_meta_data ->> 'full_name', 
      v_role, 
      v_tenant_id
    );
  EXCEPTION WHEN OTHERS THEN
    -- 🛑 LOG THE ERROR instead of failing the transaction
    INSERT INTO public.trigger_errors (user_email, error_message, error_detail)
    VALUES (NEW.email, SQLERRM, SQLSTATE);

    -- ⚠️ Fallback: Try to insert MINIMAL profile
    BEGIN
      INSERT INTO public.users_profile (id, email, full_name, role)
      VALUES (NEW.id, NEW.email, 'Fallback User', 'member');
    EXCEPTION WHEN OTHERS THEN
      -- If even fallback fails, log that too
      INSERT INTO public.trigger_errors (user_email, error_message, error_detail)
      VALUES (NEW.email, 'Fallback failed: ' || SQLERRM, SQLSTATE);
    END;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
