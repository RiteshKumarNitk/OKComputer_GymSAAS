-- COMPLETE FIX FOR TENANT ONBOARDING
-- Run this entire script in the Supabase SQL Editor.

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Update Tenants Table (Add missing columns)
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

-- 3. Create Branches Table
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
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- 4. Create Services Table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'class',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 5. Create SaaS Invoices Table
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

-- 6. Setup Storage Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tenants-public', 'tenants-public', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Define Super Admin Check Function
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

-- 8. Apply RLS Policies (Permissive for Super Admin)

-- Tenants
DROP POLICY IF EXISTS "Super admins can manage tenants" ON tenants;
CREATE POLICY "Super admins can manage tenants" ON tenants FOR ALL USING (is_super_admin());

-- Branches
DROP POLICY IF EXISTS "Super admins can manage branches" ON branches;
CREATE POLICY "Super admins can manage branches" ON branches FOR ALL USING (is_super_admin());

-- Services
DROP POLICY IF EXISTS "Super admins can manage services" ON services;
CREATE POLICY "Super admins can manage services" ON services FOR ALL USING (is_super_admin());

-- Memberships
DROP POLICY IF EXISTS "Super admins can manage memberships" ON memberships;
CREATE POLICY "Super admins can manage memberships" ON memberships FOR ALL USING (is_super_admin());

-- SaaS Invoices
DROP POLICY IF EXISTS "Super admins can manage saas_invoices" ON saas_invoices;
CREATE POLICY "Super admins can manage saas_invoices" ON saas_invoices FOR ALL USING (is_super_admin());

-- Storage
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tenants-public' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'tenants-public');


-- 9. MAKE YOU A SUPER ADMIN (Fix Permissions)
-- This ensures your user has the profile and role required.

DO $$
DECLARE
  v_user_id uuid;
  v_email text := 'riteshkumar.nitk21@gmail.com'; -- YOUR EMAIL
BEGIN
  -- Find the user in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Upsert into users_profile
    INSERT INTO public.users_profile (id, email, role, full_name)
    VALUES (v_user_id, v_email, 'super_admin', 'Ritesh Kumar')
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin';
    
    RAISE NOTICE 'User % has been promoted to super_admin', v_email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users. Please sign up first.', v_email;
  END IF;
END $$;
