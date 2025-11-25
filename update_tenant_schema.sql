-- ===================================================================
-- ENHANCED TENANT SCHEMA
-- Adding columns for Branding, Business Details, and Settings
-- ===================================================================

ALTER TABLE tenants
  -- Owner Details (Stored for reference/verification)
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS owner_email text,
  ADD COLUMN IF NOT EXISTS owner_phone text,
  
  -- Branding
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS cover_image_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#7c3aed', -- Violet default
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#4c1d95',
  
  -- Business Details
  ADD COLUMN IF NOT EXISTS business_type text, -- Gym, Studio, CrossFit, etc.
  ADD COLUMN IF NOT EXISTS gst_number text,
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS registered_address text,
  
  -- Billing Settings
  ADD COLUMN IF NOT EXISTS billing_currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS billing_cycle text DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS payment_gateway_preference text DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'INV',
  
  -- Communication Settings
  ADD COLUMN IF NOT EXISTS sms_provider text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text,
  ADD COLUMN IF NOT EXISTS email_from_name text,
  ADD COLUMN IF NOT EXISTS smtp_config jsonb; -- Store SMTP credentials securely (if needed)

-- Add indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_tenants_owner_email ON tenants(owner_email);
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type);
