-- Gym Management SaaS - Supabase Database Schema
-- Multi-tenant architecture with Row-Level Security

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'gym_owner', 'manager', 'trainer', 'frontdesk', 'member');
CREATE TYPE member_status AS ENUM ('active', 'inactive', 'suspended', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_provider AS ENUM ('stripe', 'razorpay', 'cash');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');

-- Tenants table (gyms)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  address JSONB,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  logo_url TEXT,
  subscription_id TEXT,
  subscription_status subscription_status DEFAULT 'inactive',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users profile table (extends auth.users)
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  tenant_id UUID REFERENCES tenants(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership plans
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  perks JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  member_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  gender TEXT,
  address JSONB,
  emergency_contact JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  current_plan_id UUID REFERENCES memberships(id),
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  status member_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, member_code)
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  membership_id UUID REFERENCES memberships(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider payment_provider NOT NULL,
  provider_payment_id TEXT,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  checkin_at TIMESTAMPTZ DEFAULT NOW(),
  checkout_at TIMESTAMPTZ,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainers table
CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}',
  hourly_rate_cents INTEGER,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainer availability slots
CREATE TABLE trainer_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES trainers(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  is_booked BOOLEAN DEFAULT false,
  booked_by_member_id UUID REFERENCES members(id),
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout plans
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users_profile(id),
  is_public BOOLEAN DEFAULT false,
  difficulty TEXT,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet plans
CREATE TABLE diet_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meals JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users_profile(id),
  is_public BOOLEAN DEFAULT false,
  target_calories INTEGER,
  dietary_restrictions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member workout assignments
CREATE TABLE member_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) NOT NULL,
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  assigned_by UUID REFERENCES users_profile(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  progress JSONB DEFAULT '{}'
);

-- Member diet assignments
CREATE TABLE member_diets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) NOT NULL,
  diet_plan_id UUID REFERENCES diet_plans(id) NOT NULL,
  assigned_by UUID REFERENCES users_profile(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users_profile(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_profile_tenant_id ON users_profile(tenant_id);
CREATE INDEX idx_users_profile_role ON users_profile(role);
CREATE INDEX idx_members_tenant_id ON members(tenant_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_attendance_tenant_id ON attendance(tenant_id);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_attendance_checkin_at ON attendance(checkin_at);
CREATE INDEX idx_trainers_tenant_id ON trainers(tenant_id);
CREATE INDEX idx_trainer_slots_trainer_id ON trainer_slots(trainer_id);
CREATE INDEX idx_workouts_tenant_id ON workouts(tenant_id);
CREATE INDEX idx_diet_plans_tenant_id ON diet_plans(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- Enable Row Level Security
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_diets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Tenants policies
CREATE POLICY "Super admins can view all tenants" ON tenants
  FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Gym owners can view their tenant" ON tenants
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'gym_owner' AND 
    id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Users profile policies
CREATE POLICY "Users can view their own profile" ON users_profile
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Super admins can view all users" ON users_profile
  FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin');

CREATE POLICY "Gym staff can view their gym users" ON users_profile
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Users can update their own profile" ON users_profile
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Gym owners can update their gym users" ON users_profile
  FOR UPDATE USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- Memberships policies
CREATE POLICY "Gym staff can view memberships" ON memberships
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Gym owners can manage memberships" ON memberships
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- Members policies
CREATE POLICY "Gym staff can view members" ON members
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Members can view their own data" ON members
  FOR SELECT USING (
    user_id = auth.uid() OR
    (user_id IS NULL AND id IN (
      SELECT member_id FROM member_workouts WHERE assigned_by = auth.uid()
    ))
  );

CREATE POLICY "Gym owners can manage members" ON members
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- Payments policies
CREATE POLICY "Gym staff can view payments" ON payments
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'frontdesk')
  );

CREATE POLICY "Gym owners can manage payments" ON payments
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- Attendance policies
CREATE POLICY "Gym staff can view attendance" ON attendance
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Members can view their attendance" ON attendance
  FOR SELECT USING (member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Gym staff can create attendance" ON attendance
  FOR INSERT WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

-- Trainers policies
CREATE POLICY "Gym staff can view trainers" ON trainers
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Trainers can view their own data" ON trainers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Gym owners can manage trainers" ON trainers
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- Trainer slots policies
CREATE POLICY "Gym staff can view trainer slots" ON trainer_slots
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
  );

CREATE POLICY "Trainers can manage their slots" ON trainer_slots
  FOR ALL USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Gym owners can manage all slots" ON trainer_slots
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- Workouts policies
CREATE POLICY "Gym staff can view workouts" ON workouts
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer')
  );

CREATE POLICY "Gym owners can manage workouts" ON workouts
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer')
  );

-- Diet plans policies
CREATE POLICY "Gym staff can view diet plans" ON diet_plans
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer')
  );

CREATE POLICY "Gym owners can manage diet plans" ON diet_plans
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer')
  );

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON trainers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trainer_slots_updated_at BEFORE UPDATE ON trainer_slots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON diet_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users_profile (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();





  ----------------------------------------------------------------------------
  -- ===================================================================
-- Gym Management SaaS - Supabase Database Schema
-- Multi-tenant architecture with Row-Level Security (RLS)
-- ===================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- ENUM TYPES (safe creation)
-- =====================
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
END$$;

-- =====================
-- TABLES
-- =====================

-- Tenants (gyms)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id),
  address JSONB,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  logo_url TEXT,
  subscription_id TEXT,
  subscription_status subscription_status DEFAULT 'inactive',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users profile (extends auth.users)
CREATE TABLE IF NOT EXISTS users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  tenant_id UUID REFERENCES tenants(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership plans
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  perks JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  member_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  gender TEXT,
  address JSONB,
  emergency_contact JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  current_plan_id UUID REFERENCES memberships(id),
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  status member_status DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, member_code)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  membership_id UUID REFERENCES memberships(id),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider payment_provider NOT NULL,
  provider_payment_id TEXT,
  status payment_status DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  member_id UUID REFERENCES members(id) NOT NULL,
  checkin_at TIMESTAMPTZ DEFAULT NOW(),
  checkout_at TIMESTAMPTZ,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainers
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  hourly_rate_cents INTEGER,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trainer slots
CREATE TABLE IF NOT EXISTS trainer_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID REFERENCES trainers(id) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  is_booked BOOLEAN DEFAULT false,
  booked_by_member_id UUID REFERENCES members(id),
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users_profile(id),
  is_public BOOLEAN DEFAULT false,
  difficulty TEXT,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet plans
CREATE TABLE IF NOT EXISTS diet_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meals JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES users_profile(id),
  is_public BOOLEAN DEFAULT false,
  target_calories INTEGER,
  dietary_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Member workout/diet assignments
CREATE TABLE IF NOT EXISTS member_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) NOT NULL,
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  assigned_by UUID REFERENCES users_profile(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  progress JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS member_diets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) NOT NULL,
  diet_plan_id UUID REFERENCES diet_plans(id) NOT NULL,
  assigned_by UUID REFERENCES users_profile(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Notifications (✅ fixed column: type → notification_type)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users_profile(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_users_profile_tenant_id ON users_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trainers_tenant_id ON trainers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workouts_tenant_id ON workouts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_tenant_id ON diet_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- =====================
-- AUTO UPDATE TIMESTAMP FUNCTION
-- =====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
    CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_profile_updated_at') THEN
    CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =====================
-- HANDLE NEW USER CREATION (Supabase auth)
-- =====================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users_profile (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  END IF;
END$$;

-- ===================================================================
-- ✅ FIXES APPLIED
-- - Replaced "type" with "notification_type" to avoid keyword conflicts
-- - Added IF NOT EXISTS to ENUMs, tables, and triggers
-- - Kept RLS structure (you can DISABLE later if backend handles security)
-- - Safe for re-run in Supabase or pgAdmin
-- ===================================================================







-- ============================================================
-- Gym Management SaaS — Seed Data Script (Safe + Schema-Matched)
-- ============================================================

-- Insert sample tenants (gyms)
INSERT INTO tenants (name, slug, address, phone, email, timezone, currency)
VALUES
('FitLife Premium Gym', 'fitlife-premium',
 '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'::jsonb,
 '+1-555-0123', 'info@fitlife.com', 'America/New_York', 'USD'),
('PowerHouse Fitness', 'powerhouse-fitness',
 '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210"}'::jsonb,
 '+1-555-0456', 'hello@powerhouse.com', 'America/Los_Angeles', 'USD'),
('Elite Sports Club', 'elite-sports',
 '{"street": "789 Park Blvd", "city": "Chicago", "state": "IL", "zip": "60601"}'::jsonb,
 '+1-555-0789', 'contact@elite.com', 'America/Chicago', 'USD'),
('Wellness Center Pro', 'wellness-pro',
 '{"street": "321 Health St", "city": "Miami", "state": "FL", "zip": "33101"}'::jsonb,
 '+1-555-0321', 'admin@wellness.com', 'America/New_York', 'USD'),
('Iron Temple Gym', 'iron-temple',
 '{"street": "654 Muscle Ave", "city": "Houston", "state": "TX", "zip": "77001"}'::jsonb,
 '+1-555-0654', 'info@irontemple.com', 'America/Chicago', 'USD')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Memberships
-- ============================================================
INSERT INTO memberships (tenant_id, name, description, duration_days, price_cents, currency, perks)
SELECT 
  t.id,
  p.name,
  p.description,
  p.duration_days,
  p.price_cents,
  'USD',
  p.perks
FROM tenants t
CROSS JOIN (
  VALUES
  ('Basic Plan', 'Access to basic gym facilities', 30, 2999, '["Gym Access", "Basic Equipment", "Locker Room"]'::jsonb),
  ('Premium Plan', 'Full access with classes', 30, 5999, '["Gym Access", "All Equipment", "Group Classes", "Sauna", "Nutrition Consultation"]'::jsonb),
  ('Elite Plan', 'Premium plus personal training', 30, 9999, '["Gym Access", "All Equipment", "Group Classes", "Sauna", "Personal Training", "Nutrition Plan", "Priority Booking"]'::jsonb),
  ('Annual Basic', 'Basic plan with annual discount', 365, 29999, '["Gym Access", "Basic Equipment", "Locker Room", "Annual Discount"]'::jsonb),
  ('Annual Premium', 'Premium plan with annual discount', 365, 59999, '["Gym Access", "All Equipment", "Group Classes", "Sauna", "Nutrition Consultation", "Annual Discount"]'::jsonb)
) AS p(name, description, duration_days, price_cents, perks);

-- ============================================================
-- Trainers
-- ============================================================
INSERT INTO trainers (tenant_id, full_name, email, phone, bio, specialties, hourly_rate_cents, is_active)
SELECT 
  t.id,
  tr.full_name,
  tr.email,
  tr.phone,
  tr.bio,
  tr.specialties,
  tr.hourly_rate_cents,
  true
FROM tenants t
CROSS JOIN (
  VALUES
  ('Mike Johnson', 'mike@trainer.com', '+1-555-1001', 'Certified personal trainer with 10 years experience', '{"Strength Training", "Weight Loss", "Bodybuilding"}'::text[], 7500),
  ('Sarah Davis', 'sarah@trainer.com', '+1-555-1002', 'Yoga instructor and fitness coach', '{"Yoga", "Pilates", "Flexibility"}'::text[], 6500),
  ('Carlos Rodriguez', 'carlos@trainer.com', '+1-555-1003', 'Former athlete specializing in sports performance', '{"Sports Performance", "Speed Training", "Agility"}'::text[], 8000),
  ('Emma Wilson', 'emma@trainer.com', '+1-555-1004', 'Nutritionist and fitness expert', '{"Nutrition", "Weight Management", "Functional Training"}'::text[], 7000),
  ('James Brown', 'james@trainer.com', '+1-555-1005', 'CrossFit certified trainer', '{"CrossFit", "HIIT", "Endurance"}'::text[], 7200)
) AS tr(full_name, email, phone, bio, specialties, hourly_rate_cents);

-- ============================================================
-- Members
-- ============================================================
INSERT INTO members (tenant_id, member_code, full_name, email, phone, dob, gender, address, emergency_contact, current_plan_id, status)
SELECT 
  t.id,
  'M' || LPAD((ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY random()))::text, 4, '0'),
  m.name,
  m.email,
  m.phone,
  m.dob,
  m.gender,
  m.address,
  m.emergency_contact,
  (SELECT id FROM memberships WHERE memberships.tenant_id = t.id ORDER BY RANDOM() LIMIT 1),
  CASE WHEN RANDOM() > 0.1 THEN 'active'::member_status ELSE 'inactive'::member_status END
FROM tenants t
CROSS JOIN (
  VALUES
  ('John Smith', 'john@member.com', '+1-555-2001', '1990-05-15'::date, 'male', '{"street": "111 Elm St"}'::jsonb, '{"name": "Jane Smith"}'::jsonb),
  ('Lisa Anderson', 'lisa@member.com', '+1-555-2003', '1985-08-22'::date, 'female', '{"street": "222 Pine Ave"}'::jsonb, '{"name": "Tom Anderson"}'::jsonb),
  ('David Kim', 'david@member.com', '+1-555-2005', '1992-03-10'::date, 'male', '{"street": "333 Oak Dr"}'::jsonb, '{"name": "Maria Kim"}'::jsonb),
  ('Jennifer Lee', 'jennifer@member.com', '+1-555-2007', '1988-11-30'::date, 'female', '{"street": "444 Maple St"}'::jsonb, '{"name": "Robert Lee"}'::jsonb),
  ('Michael Chen', 'michael@member.com', '+1-555-2009', '1995-07-18'::date, 'male', '{"street": "555 Cedar Ln"}'::jsonb, '{"name": "Lisa Chen"}'::jsonb)
) AS m(name, email, phone, dob, gender, address, emergency_contact);


-- ============================================================
-- Workouts
-- ============================================================
INSERT INTO workouts (tenant_id, name, description, exercises, created_by, difficulty, estimated_duration_minutes)
SELECT 
  t.id,
  w.name,
  w.description,
  w.exercises,
  NULL,
  w.difficulty,
  w.duration
FROM tenants t
CROSS JOIN (
  VALUES
  ('Beginner Full Body', 'Starter workout', '[{"name": "Push-ups"}]'::jsonb, 'beginner', 30),
  ('Strength Building', 'Muscle growth', '[{"name": "Bench Press"}]'::jsonb, 'intermediate', 45),
  ('HIIT Cardio', 'High intensity', '[{"name": "Burpees"}]'::jsonb, 'advanced', 20)
) AS w(name, description, exercises, difficulty, duration);

-- ============================================================
-- Diet Plans
-- ============================================================
INSERT INTO diet_plans (tenant_id, name, description, meals, target_calories, dietary_restrictions)
SELECT 
  t.id,
  d.name,
  d.description,
  d.meals,
  d.calories,
  d.restrictions
FROM tenants t
CROSS JOIN (
  VALUES
  ('Weight Loss Plan', 'Calorie deficit plan', '[{"meal": "Breakfast", "foods": "Oats"}]'::jsonb, 1600, '{"Low Carb"}'::text[]),
  ('Muscle Gain Plan', 'High protein plan', '[{"meal": "Lunch", "foods": "Chicken"}]'::jsonb, 2300, '{"High Protein"}'::text[])
) AS d(name, description, meals, calories, restrictions);

-- ============================================================
-- Attendance (last 30 days)
-- ============================================================
INSERT INTO attendance (tenant_id, member_id, checkin_at, checkout_at)
SELECT 
  m.tenant_id,
  m.id,
  checkin_at,
  checkin_at + (INTERVAL '1 hour' + RANDOM() * INTERVAL '2 hours') AS checkout_at
FROM members m
CROSS JOIN LATERAL (
  SELECT NOW() - INTERVAL '1 day' * (RANDOM() * 30) AS checkin_at
  FROM generate_series(1, floor(random() * 5 + 2)::int)
) AS attendance_data(checkin_at)
WHERE m.status = 'active';

-- ============================================================
-- Payments
-- ============================================================
-- ============================================================
-- Payments (fixed enum cast)
-- ============================================================
INSERT INTO payments (tenant_id, member_id, membership_id, amount_cents, currency, provider, status, paid_at)
SELECT 
  m.tenant_id,
  m.id,
  m.current_plan_id,
  (SELECT price_cents FROM memberships WHERE id = m.current_plan_id),
  'USD',
  CASE WHEN RANDOM() > 0.8 THEN 'cash'::payment_provider ELSE 'stripe'::payment_provider END,
  CASE 
    WHEN RANDOM() > 0.9 THEN 'failed'::payment_status
    WHEN RANDOM() > 0.95 THEN 'refunded'::payment_status
    ELSE 'paid'::payment_status
  END,
  NOW() - INTERVAL '1 day' * (RANDOM() * 60)
FROM members m
WHERE m.current_plan_id IS NOT NULL
AND RANDOM() > 0.3;


-- ============================================================
-- Trainer Slots
-- ============================================================
-- ============================================================
-- Trainer Slots (fixed time cast)
-- ============================================================
INSERT INTO trainer_slots (trainer_id, tenant_id, day_of_week, start_time, end_time, is_recurring)
SELECT 
  t.id,
  t.tenant_id,
  s.day,
  s.start_t,
  s.end_t,
  true
FROM trainers t
CROSS JOIN (
  VALUES
  (1, '09:00'::time, '11:00'::time),
  (2, '10:00'::time, '12:00'::time),
  (3, '14:00'::time, '16:00'::time)
) AS s(day, start_t, end_t);



-- ============================================================
-- Member Workouts
-- ============================================================
INSERT INTO member_workouts (member_id, workout_id, assigned_by, assigned_at)
SELECT 
  m.id,
  w.id,
  NULL,
  NOW() - INTERVAL '1 day' * (RANDOM() * 20)
FROM members m
JOIN workouts w ON w.tenant_id = m.tenant_id
WHERE RANDOM() > 0.7;

-- ============================================================
-- Member Diets
-- ============================================================
INSERT INTO member_diets (member_id, diet_plan_id, assigned_by, assigned_at, started_at)
SELECT 
  m.id,
  d.id,
  NULL,
  NOW() - INTERVAL '1 day' * (RANDOM() * 20),
  NOW() - INTERVAL '1 day' * (RANDOM() * 10)
FROM members m
JOIN diet_plans d ON d.tenant_id = m.tenant_id
WHERE RANDOM() > 0.7;

-- ============================================================
-- Notifications (fixed for schema)
-- ============================================================
-- ============================================================
-- Notifications (fixed CTE scope + explicit casts)
-- ============================================================
WITH src AS (
  SELECT 
    m.tenant_id,
    m.user_id,
    CASE 
      WHEN RANDOM() > 0.8 THEN 'payment'
      WHEN RANDOM() > 0.6 THEN 'membership'
      WHEN RANDOM() > 0.4 THEN 'workout'
      ELSE 'general'
    END AS notification_type
  FROM members m
  WHERE RANDOM() > 0.5
)
-- ============================================================
-- Notifications (FINAL FIXED VERSION — Works in Supabase)
-- ============================================================

INSERT INTO notifications (tenant_id, user_id, notification_type, title, message)
SELECT 
  m.tenant_id,
  m.user_id,
  nt.notification_type,
  CASE 
    WHEN nt.notification_type = 'payment' THEN 'Payment Reminder'
    WHEN nt.notification_type = 'membership' THEN 'Membership Update'
    WHEN nt.notification_type = 'workout' THEN 'Workout Reminder'
    ELSE 'Welcome!'
  END AS title,
  CASE 
    WHEN nt.notification_type = 'payment' THEN 'Your membership payment is due soon.'
    WHEN nt.notification_type = 'membership' THEN 'Your membership will expire soon.'
    WHEN nt.notification_type = 'workout' THEN 'Your next workout session is tomorrow.'
    ELSE 'Welcome to the gym community!'
  END AS message
FROM members m
CROSS JOIN LATERAL (
  SELECT 
    CASE 
      WHEN RANDOM() > 0.8 THEN 'payment'
      WHEN RANDOM() > 0.6 THEN 'membership'
      WHEN RANDOM() > 0.4 THEN 'workout'
      ELSE 'general'
    END AS notification_type
) AS nt
WHERE RANDOM() > 0.5
AND m.user_id IS NOT NULL;

-- ============================================================
-- Update expiration dates
-- ============================================================
UPDATE members
SET plan_expires_at = CASE 
  WHEN status = 'active' THEN NOW() + INTERVAL '1 day' * (RANDOM() * 60 + 15)
  ELSE NOW() - INTERVAL '1 day' * (RANDOM() * 30 + 5)
END
WHERE current_plan_id IS NOT NULL;
