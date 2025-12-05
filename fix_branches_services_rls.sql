-- ===================================================================
-- FIX BRANCHES AND SERVICES RLS
-- ===================================================================

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS branches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  manager_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  type text DEFAULT 'class',
  capacity int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 3. Drop Existing Policies (to ensure clean slate)
DROP POLICY IF EXISTS "Owners and Managers can manage branches" ON branches;
DROP POLICY IF EXISTS "Staff and Members can view branches" ON branches;
DROP POLICY IF EXISTS "Owners and Managers can manage services" ON services;
DROP POLICY IF EXISTS "Staff and Members can view services" ON services;

-- 4. Create Policies (using standard RLS compatible with users_profile)

-- BRANCHES
CREATE POLICY "Owners and Managers can manage branches" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = branches.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

CREATE POLICY "Staff and Members can view branches" ON branches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = branches.tenant_id
    )
  );

-- SERVICES
CREATE POLICY "Owners and Managers can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = services.tenant_id
      AND role IN ('gym_owner', 'manager')
    )
  );

CREATE POLICY "Staff and Members can view services" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() 
      AND tenant_id = services.tenant_id
    )
  );

-- 5. Grant Permissions (just in case)
GRANT ALL ON branches TO authenticated;
GRANT ALL ON services TO authenticated;
GRANT ALL ON branches TO service_role;
GRANT ALL ON services TO service_role;
