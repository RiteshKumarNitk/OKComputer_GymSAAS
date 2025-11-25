-- ===================================================================
-- RLS FIX MIGRATION
-- This script drops existing policies and recreates them using 
-- users_profile lookup instead of JWT claims.
-- ===================================================================

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Super admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Gym owners can view their tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view their own profile" ON users_profile;
DROP POLICY IF EXISTS "Super admins can view all users" ON users_profile;
DROP POLICY IF EXISTS "Gym staff can view their gym users" ON users_profile;
DROP POLICY IF EXISTS "Users can update their own profile" ON users_profile;
DROP POLICY IF EXISTS "Gym owners can update their gym users" ON users_profile;
DROP POLICY IF EXISTS "Gym staff can view memberships" ON memberships;
DROP POLICY IF EXISTS "Gym owners can manage memberships" ON memberships;
DROP POLICY IF EXISTS "Gym staff can view members" ON members;
DROP POLICY IF EXISTS "Members can view their own data" ON members;
DROP POLICY IF EXISTS "Gym owners can manage members" ON members;
DROP POLICY IF EXISTS "Gym staff can view payments" ON payments;
DROP POLICY IF EXISTS "Gym owners can manage payments" ON payments;
DROP POLICY IF EXISTS "Gym staff can view attendance" ON attendance;
DROP POLICY IF EXISTS "Members can view their attendance" ON attendance;
DROP POLICY IF EXISTS "Gym staff can create attendance" ON attendance;
DROP POLICY IF EXISTS "Gym staff can view trainers" ON trainers;
DROP POLICY IF EXISTS "Trainers can view their own data" ON trainers;
DROP POLICY IF EXISTS "Gym owners can manage trainers" ON trainers;
DROP POLICY IF EXISTS "Gym staff can view trainer slots" ON trainer_slots;
DROP POLICY IF EXISTS "Trainers can manage their slots" ON trainer_slots;
DROP POLICY IF EXISTS "Gym owners can manage all slots" ON trainer_slots;
DROP POLICY IF EXISTS "Gym staff can view workouts" ON workouts;
DROP POLICY IF EXISTS "Gym owners can manage workouts" ON workouts;
DROP POLICY IF EXISTS "Gym staff can view diet plans" ON diet_plans;
DROP POLICY IF EXISTS "Gym owners can manage diet plans" ON diet_plans;

-- 2. Recreate Policies using users_profile lookup

-- Helper function to check role and tenant
-- (Optional optimization, but we'll stick to direct subqueries for portability)

-- Tenants policies
CREATE POLICY "Super admins can view all tenants" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Gym owners can view their tenant" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role = 'gym_owner' 
      AND tenant_id = tenants.id
    )
  );

-- Users profile policies
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON users_profile
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Gym staff can view their gym users" ON users_profile
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Gym owners can update their gym users" ON users_profile
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Memberships policies
CREATE POLICY "Gym staff can view memberships" ON memberships
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

CREATE POLICY "Gym owners can manage memberships" ON memberships
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Members policies
CREATE POLICY "Gym staff can view members" ON members
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

CREATE POLICY "Members can view their own data" ON members
  FOR SELECT USING (
    user_id = auth.uid()
  );

CREATE POLICY "Gym owners can manage members" ON members
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Payments policies
CREATE POLICY "Gym staff can view payments" ON payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'frontdesk')
    )
  );

CREATE POLICY "Gym owners can manage payments" ON payments
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Attendance policies
CREATE POLICY "Gym staff can view attendance" ON attendance
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

CREATE POLICY "Members can view their attendance" ON attendance
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Gym staff can create attendance" ON attendance
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

-- Trainers policies
CREATE POLICY "Gym staff can view trainers" ON trainers
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

CREATE POLICY "Trainers can view their own data" ON trainers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Gym owners can manage trainers" ON trainers
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Trainer slots policies
CREATE POLICY "Gym staff can view trainer slots" ON trainer_slots
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
    )
  );

CREATE POLICY "Trainers can manage their slots" ON trainer_slots
  FOR ALL USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can manage all slots" ON trainer_slots
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Workouts policies
CREATE POLICY "Gym staff can view workouts" ON workouts
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer')
    )
  );

CREATE POLICY "Gym owners can manage workouts" ON workouts
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer')
    )
  );

-- Diet plans policies
CREATE POLICY "Gym staff can view diet plans" ON diet_plans
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer')
    )
  );

CREATE POLICY "Gym owners can manage diet plans" ON diet_plans
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM users_profile WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND role IN ('gym_owner', 'manager', 'trainer')
    )
  );
