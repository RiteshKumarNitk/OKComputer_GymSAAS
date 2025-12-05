-- ===================================================================
-- FIX FRONT DESK RLS
-- ===================================================================

-- 1. Enable RLS (just in case)
ALTER TABLE front_desk ENABLE ROW LEVEL SECURITY;

-- 2. Drop Existing Policies
DROP POLICY IF EXISTS "Gym staff can view front_desk" ON front_desk;
DROP POLICY IF EXISTS "Gym owners can manage front_desk" ON front_desk;
DROP POLICY IF EXISTS "Owners and Managers can manage front_desk" ON front_desk;
DROP POLICY IF EXISTS "Staff and Members can view front_desk" ON front_desk;

-- 3. Create New Robust Policies

-- Policy: Owners and Managers can do EVERYTHING (Insert, Update, Delete, Select)
CREATE POLICY "Owners and Managers can manage front_desk" ON front_desk
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = front_desk.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Policy: Staff (Trainers, Front Desk) can VIEW
CREATE POLICY "Staff can view front_desk" ON front_desk
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = front_desk.tenant_id
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

-- 4. Grant Permissions
GRANT ALL ON front_desk TO authenticated;
GRANT ALL ON front_desk TO service_role;
