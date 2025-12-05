-- Fix Tenant Creation Issues

-- 1. Add missing columns to 'tenants' table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS registered_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_currency TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_gateway_preference TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS invoice_prefix TEXT;

-- 2. Create 'branches' table if it doesn't exist
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on branches
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- Add policies for branches
DROP POLICY IF EXISTS "Super admins can manage branches" ON branches;
CREATE POLICY "Super admins can manage branches" ON branches
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Tenant owners can manage their branches" ON branches;
CREATE POLICY "Tenant owners can manage their branches" ON branches
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );

-- 3. Create 'services' table if it doesn't exist
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'class',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Add policies for services
DROP POLICY IF EXISTS "Super admins can manage services" ON services;
CREATE POLICY "Super admins can manage services" ON services
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Tenant owners can manage their services" ON services;
CREATE POLICY "Tenant owners can manage their services" ON services
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
  );
