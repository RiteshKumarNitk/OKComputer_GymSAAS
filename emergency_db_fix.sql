-- EMERGENCY DATABASE FIX
-- This script will fix missing tables/columns and temporarily disable security restrictions (RLS) 
-- to ensure you can create tenants.

-- 1. Tenants Table Fixes
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

-- 2. Create Branches Table (if missing)
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

-- 3. Create Services Table (if missing)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'class',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create SaaS Invoices Table (if missing)
CREATE TABLE IF NOT EXISTS saas_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  invoice_number TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DISABLE ROW LEVEL SECURITY (RLS) TEMPORARILY
-- This allows ANY logged-in user to write to these tables.
-- This is to rule out permission errors.
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invoices DISABLE ROW LEVEL SECURITY;

-- 6. Ensure Storage Bucket Exists & is Public
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenants-public', 'tenants-public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 7. Fix Storage Permissions (Make it public for now)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR ALL USING (bucket_id = 'tenants-public');

-- 8. Promote User to Super Admin (Just in case)
UPDATE users_profile
SET role = 'super_admin'
WHERE email = 'riteshkumar.nitk21@gmail.com';
