-- Fix missing profile for the user trying to login
-- User ID taken from your error logs: 6f2cfcaf-5662-4c8b-8833-462a5941e918

INSERT INTO public.users_profile (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'New User'),
  COALESCE((raw_user_meta_data->>'role')::user_role, 'gym_owner')
FROM auth.users
WHERE id = '6f2cfcaf-5662-4c8b-8833-462a5941e918'
ON CONFLICT (id) DO NOTHING;

-- Also ensure RLS allows reading/writing own profile
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);
