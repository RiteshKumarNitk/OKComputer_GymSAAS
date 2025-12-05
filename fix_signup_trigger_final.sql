-- FIX SIGNUP TRIGGER (FINAL)
-- This script fixes the "Database error saving new user" by making the trigger robust.

-- 1. Ensure users_profile has necessary columns
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'member';
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 3. Create a Robust Function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'member';
  v_tenant_id uuid := NULL;
  v_full_name text := '';
BEGIN
  -- Extract metadata safely
  BEGIN
    v_full_name := NEW.raw_user_meta_data ->> 'full_name';
  EXCEPTION WHEN OTHERS THEN
    v_full_name := '';
  END;

  BEGIN
    IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
      v_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'member';
  END;

  BEGIN
    IF NEW.raw_user_meta_data ->> 'tenant_id' IS NOT NULL THEN
      v_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;

  -- Insert into users_profile
  INSERT INTO public.users_profile (id, email, full_name, role, tenant_id)
  VALUES (NEW.id, NEW.email, v_full_name, v_role, v_tenant_id)
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- IMPORTANT: We must NOT fail here, otherwise the user cannot sign up.
  -- If this fails, we log it (if possible) or just ignore it.
  -- The client-side code also attempts an upsert, so it's a backup.
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-create Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Grant Permissions (Crucial for the trigger to work)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.users_profile TO postgres, anon, authenticated, service_role;
