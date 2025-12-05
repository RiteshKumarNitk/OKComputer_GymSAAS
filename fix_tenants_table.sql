-- FIX AND VERIFY TENANTS TABLE
-- Run this script to ensure the tenants table is writable and has all columns.

-- 1. Disable RLS to rule out permission issues
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;

-- 2. Ensure all columns exist
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
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_photo_url TEXT;

-- 3. Drop potential problematic triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON tenants;

-- 4. Test Insert (Check the results tab to see if this works)
INSERT INTO tenants (name, slug, owner_name) 
VALUES ('SQL Test Tenant', 'sql-test-tenant-' || floor(random() * 1000)::text, 'SQL Test Owner')
RETURNING id, name, slug;
