-- ===================================================================
-- FIX TENANT CREATION RLS
-- This script allows Super Admins to INSERT/UPDATE/DELETE tenants.
-- ===================================================================

-- 1. Drop the read-only policy if it exists (to replace with full access)
DROP POLICY IF EXISTS "Super admins can view all tenants" ON tenants;

-- 2. Create a comprehensive policy for Super Admins
CREATE POLICY "Super admins can manage tenants" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 3. Ensure Gym Owners can still view their tenant (if not already present)
-- (This might already exist from previous scripts, but safe to re-run if dropped)
-- DROP POLICY IF EXISTS "Gym owners can view their tenant" ON tenants;
-- CREATE POLICY "Gym owners can view their tenant" ON tenants
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM users_profile
--       WHERE id = auth.uid() 
--       AND role = 'gym_owner' 
--       AND tenant_id = tenants.id
--     )
--   );
