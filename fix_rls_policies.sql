-- ===================================================================
-- FIX RLS POLICIES (ROBUST CHECK VIA USERS_PROFILE)
-- ===================================================================
-- This script replaces fragile JWT-based policies with robust checks against users_profile.
-- This ensures that even if the JWT is stale (missing tenant_id), the database still allows access.

-- -------------------------------------------------------------------
-- 1. FRONT DESK
-- -------------------------------------------------------------------
ALTER TABLE front_desk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym staff can view front_desk" ON front_desk;
DROP POLICY IF EXISTS "Gym owners can manage front_desk" ON front_desk;
DROP POLICY IF EXISTS "Owners and Managers can manage front_desk" ON front_desk;
DROP POLICY IF EXISTS "Staff and Members can view front_desk" ON front_desk;

CREATE POLICY "Owners and Managers can manage front_desk" ON front_desk
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = front_desk.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

CREATE POLICY "Staff can view front_desk" ON front_desk
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = front_desk.tenant_id
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

-- -------------------------------------------------------------------
-- 2. TRAINERS
-- -------------------------------------------------------------------
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym staff can view trainers" ON trainers;
DROP POLICY IF EXISTS "Gym owners can manage trainers" ON trainers;

CREATE POLICY "Owners and Managers can manage trainers" ON trainers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = trainers.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

CREATE POLICY "Staff can view trainers" ON trainers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = trainers.tenant_id
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

-- -------------------------------------------------------------------
-- 3. MEMBERS
-- -------------------------------------------------------------------
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Gym owners can manage members" ON members;
-- Note: We keep "Gym staff can view members" but might want to update it too.
-- For now, let's just fix the management policy which is blocking inserts.

CREATE POLICY "Owners and Managers can manage members" ON members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = members.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

-- 4. Grant Permissions
GRANT ALL ON front_desk TO authenticated;
GRANT ALL ON trainers TO authenticated;
GRANT ALL ON members TO authenticated;
