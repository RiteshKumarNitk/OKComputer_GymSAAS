-- ===================================================================
-- TENANT BUSINESS STRUCTURE
-- Branches and Services Tables
-- ===================================================================

-- 1. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  manager_id uuid REFERENCES auth.users(id), -- Optional link to a manager
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Branches
-- Gym Owner & Manager: Full Access
CREATE POLICY "Owners and Managers can manage branches" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = branches.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Staff & Members: Read Only
CREATE POLICY "Staff and Members can view branches" ON branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = branches.tenant_id
    )
  );


-- 2. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g., "Yoga", "Zumba", "General Gym Access"
  description text,
  type text DEFAULT 'class', -- 'class', 'facility', 'training'
  capacity int, -- Optional capacity limit per session
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Services
-- Gym Owner & Manager: Full Access
CREATE POLICY "Owners and Managers can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = services.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

-- Staff & Members: Read Only
CREATE POLICY "Staff and Members can view services" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = services.tenant_id
    )
  );

-- 3. UPDATE MEMBERSHIPS TABLE (Enhancement)
-- Add 'type' to memberships if not exists, to distinguish between Time-based and Session-based (PT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memberships' AND column_name = 'type') THEN
        ALTER TABLE memberships ADD COLUMN type text DEFAULT 'recurring'; -- 'recurring', 'package', 'one_time'
    END IF;
END $$;
