-- DISABLE SIGNUP TRIGGER TO UNBLOCK USER CREATION
-- The trigger seems to be causing the "Database error saving new user".
-- We will rely on the client-side code to create the user profile for now.

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Grant Permissions to allow Client-Side Insert
-- This allows the logged-in user (or anon during signup) to insert their own profile.
GRANT ALL ON TABLE public.users_profile TO postgres, anon, authenticated, service_role;

-- 3. Ensure RLS Policy allows Insert
-- We need a policy that allows a user to insert their OWN profile.
DROP POLICY IF EXISTS "Users can insert their own profile" ON users_profile;
CREATE POLICY "Users can insert their own profile" ON users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Ensure RLS Policy allows Update (for the upsert)
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);
