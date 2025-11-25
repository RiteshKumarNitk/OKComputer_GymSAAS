-- ===================================================================
-- SUPABASE COMPLETE FIX (Idempotent)
-- Run this script to fix everything safely.
-- ===================================================================

-- 1. SAFE TYPE CREATION
-- Checks if types exist before creating them to avoid "type already exists" errors.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'gym_owner', 'manager', 'trainer', 'frontdesk', 'member');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
    CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'expired');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_provider') THEN
    CREATE TYPE payment_provider AS ENUM ('stripe', 'razorpay', 'cash');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');
  END IF;
END $$;

-- 2. SCHEMA REPAIR (Add missing column if needed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tenants' 
    AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE tenants ADD COLUMN owner_user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 3. RLS HELPERS (Security Definer Functions)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users_profile WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT tenant_id FROM users_profile WHERE id = auth.uid();
$$;

-- 4. CLEANUP OLD POLICIES
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

-- 5. APPLY NEW POLICIES

-- Tenants
CREATE POLICY "Super admins can view all tenants" ON tenants
  FOR SELECT USING (get_my_role() = 'super_admin');

CREATE POLICY "Gym owners can view their tenant" ON tenants
  FOR SELECT USING (
    get_my_role() = 'gym_owner' 
    AND id = get_my_tenant_id()
  );

-- Users Profile
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON users_profile
  FOR SELECT USING (get_my_role() = 'super_admin');

CREATE POLICY "Gym staff can view their gym users" ON users_profile
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

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

CREATE POLICY "Members can view their own data" ON members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Gym owners can manage members" ON members
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- Payments
CREATE POLICY "Gym staff can view payments" ON payments
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'frontdesk')
  );

CREATE POLICY "Gym owners can manage payments" ON payments
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- Attendance
CREATE POLICY "Gym staff can view attendance" ON attendance
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Members can view their attendance" ON attendance
  FOR SELECT USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

CREATE POLICY "Gym staff can create attendance" ON attendance
  FOR INSERT WITH CHECK (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

-- Trainers
CREATE POLICY "Gym staff can view trainers" ON trainers
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Trainers can view their own data" ON trainers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Gym owners can manage trainers" ON trainers
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- Trainer Slots
CREATE POLICY "Gym staff can view trainer slots" ON trainer_slots
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Trainers can manage their slots" ON trainer_slots
  FOR ALL USING (
    trainer_id IN (SELECT id FROM trainers WHERE user_id = auth.uid())
  );

CREATE POLICY "Gym owners can manage all slots" ON trainer_slots
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager')
  );

-- Workouts
CREATE POLICY "Gym staff can view workouts" ON workouts
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer')
  );

CREATE POLICY "Gym owners can manage workouts" ON workouts
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer')
  );

-- Diet Plans
CREATE POLICY "Gym staff can view diet plans" ON diet_plans
  FOR SELECT USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer')
  );

CREATE POLICY "Gym owners can manage diet plans" ON diet_plans
  FOR ALL USING (
    tenant_id = get_my_tenant_id()
    AND get_my_role() IN ('gym_owner', 'manager', 'trainer')
  );

-- 6. USER PROMOTION (Safe)
DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  -- Get the latest user
  SELECT id INTO v_user_id FROM users_profile ORDER BY created_at DESC LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Promote to gym_owner
    UPDATE users_profile SET role = 'gym_owner' WHERE id = v_user_id;

    -- Check tenant
    SELECT tenant_id INTO v_tenant_id FROM users_profile WHERE id = v_user_id;
    
    IF v_tenant_id IS NULL THEN
      -- Create a new tenant
      INSERT INTO tenants (name, slug, owner_user_id)
      VALUES ('My Gym', 'my-gym-' || substr(uuid_generate_v4()::text, 1, 8), v_user_id)
      RETURNING id INTO v_tenant_id;
      
      -- Link user to tenant
      UPDATE users_profile 
      SET tenant_id = v_tenant_id 
      WHERE id = v_user_id;
    END IF;
  END IF;
END $$;
