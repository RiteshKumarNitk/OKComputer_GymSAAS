-- ===================================================================
-- FIX MISSING PROFILE & TRIGGER
-- 1. Ensures the "handle_new_user" trigger is working.
-- 2. Manually creates the missing profile for the user getting 406 error.
-- ===================================================================

-- 1. Re-create the Trigger Function (Robust Version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name, role, tenant_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(new.raw_user_meta_data->>'role', 'member'), -- Default to member
    CASE 
      WHEN new.raw_user_meta_data->>'tenant_id' IS NOT NULL 
      THEN (new.raw_user_meta_data->>'tenant_id')::uuid 
      ELSE NULL 
    END
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile exists
  RETURN new;
END;
$$;

-- 2. Re-bind the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Manually Insert/Fix the Specific User Profile
-- We select from auth.users to get the correct email
INSERT INTO public.users_profile (id, email, role, full_name)
SELECT 
  id,
  email,
  'super_admin', -- Force this user to be Super Admin
  COALESCE(raw_user_meta_data->>'full_name', 'Super Admin')
FROM auth.users
WHERE id = 'fd87404f-430a-4195-8ee8-2992a307f995'
ON CONFLICT (id) DO UPDATE
SET role = 'super_admin'; -- Ensure they are super_admin if they already exist

-- 4. Verify RLS Policy for Self-View (Just in case)
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);
