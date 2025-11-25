-- ===================================================================
-- NUCLEAR RLS FIX
-- This script fixes the "Infinite Recursion" error by using 
-- SECURITY DEFINER functions to safely lookup user data.
-- ===================================================================

-- 1. Create Helper Functions (Bypass RLS)
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM users_profile WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users_profile WHERE id = auth.uid();
$$;

-- 2. Drop Recursive Policies
DROP POLICY IF EXISTS "Gym staff can view their gym users" ON users_profile;
DROP POLICY IF EXISTS "Gym owners can update their gym users" ON users_profile;
DROP POLICY IF EXISTS "Gym staff can view memberships" ON memberships;
DROP POLICY IF EXISTS "Gym owners can manage memberships" ON memberships;
DROP POLICY IF EXISTS "Gym staff can view members" ON members;
DROP POLICY IF EXISTS "Gym owners can manage members" ON members;

-- 3. Recreate Policies using Helper Functions

-- Users Profile
CREATE POLICY "Gym staff can view their gym users" ON users_profile
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Gym owners can update their gym users" ON users_profile
  FOR UPDATE USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- Memberships
CREATE POLICY "Gym staff can view memberships" ON memberships
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Gym owners can manage memberships" ON memberships
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- Members
CREATE POLICY "Gym staff can view members" ON members
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Gym owners can manage members" ON members
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- 4. Ensure Basic Access
-- (These usually don't recurse, but good to double check)
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);
