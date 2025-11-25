-- ===================================================================
-- SUPER ADMIN PERMISSIONS FIX
-- Grants 'super_admin' role full access to all core tables.
-- This bypasses tenant-isolation checks for the Super Admin.
-- ===================================================================

-- Helper function to check if user is super_admin
-- (Re-using the one from nuclear fix, but ensuring it exists)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- 1. Tenants
DROP POLICY IF EXISTS "Super admins can manage tenants" ON tenants;
CREATE POLICY "Super admins can manage tenants" ON tenants
  FOR ALL
  USING (is_super_admin());

-- Allow public read for login/signup resolution
DROP POLICY IF EXISTS "Public can view tenants" ON tenants;
CREATE POLICY "Public can view tenants" ON tenants
  FOR SELECT
  USING (true);


-- 2. Branches
DROP POLICY IF EXISTS "Super admins can manage branches" ON branches;
CREATE POLICY "Super admins can manage branches" ON branches
  FOR ALL
  USING (is_super_admin());


-- 3. Services
DROP POLICY IF EXISTS "Super admins can manage services" ON services;
CREATE POLICY "Super admins can manage services" ON services
  FOR ALL
  USING (is_super_admin());


-- 4. Memberships
DROP POLICY IF EXISTS "Super admins can manage memberships" ON memberships;
CREATE POLICY "Super admins can manage memberships" ON memberships
  FOR ALL
  USING (is_super_admin());


-- 5. Users Profile (To view/edit owners)
DROP POLICY IF EXISTS "Super admins can manage profiles" ON users_profile;
CREATE POLICY "Super admins can manage profiles" ON users_profile
  FOR ALL
  USING (is_super_admin());
