-- Fix Onboarding Process Permissions & Schema

-- 1. Ensure is_super_admin function exists and works
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- 2. Grant Super Admin Full Access to Tenants
DROP POLICY IF EXISTS "Super admins can manage tenants" ON tenants;
CREATE POLICY "Super admins can manage tenants" ON tenants
  FOR ALL
  USING (is_super_admin());

DROP POLICY IF EXISTS "Public can view tenants" ON tenants;
CREATE POLICY "Public can view tenants" ON tenants
  FOR SELECT
  USING (true);

-- 3. Grant Super Admin Full Access to Branches
DROP POLICY IF EXISTS "Super admins can manage branches" ON branches;
CREATE POLICY "Super admins can manage branches" ON branches
  FOR ALL
  USING (is_super_admin());

-- 4. Grant Super Admin Full Access to Services
DROP POLICY IF EXISTS "Super admins can manage services" ON services;
CREATE POLICY "Super admins can manage services" ON services
  FOR ALL
  USING (is_super_admin());

-- 5. Grant Super Admin Full Access to Memberships
DROP POLICY IF EXISTS "Super admins can manage memberships" ON memberships;
CREATE POLICY "Super admins can manage memberships" ON memberships
  FOR ALL
  USING (is_super_admin());

-- 6. Grant Super Admin Full Access to SaaS Invoices
DROP POLICY IF EXISTS "Super admins can manage saas_invoices" ON saas_invoices;
CREATE POLICY "Super admins can manage saas_invoices" ON saas_invoices
  FOR ALL
  USING (is_super_admin());

-- 7. Ensure saas_invoices table exists (if not already)
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
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;

-- 8. Ensure storage bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenants-public', 'tenants-public', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Ensure storage policies
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenants-public' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tenants-public' );

-- 10. Ensure tenants table has necessary columns
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_photo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 11. Ensure services table has type column
ALTER TABLE services ADD COLUMN IF NOT EXISTS type text DEFAULT 'class';

-- 12. Ensure memberships table has type column
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS type text DEFAULT 'recurring';
