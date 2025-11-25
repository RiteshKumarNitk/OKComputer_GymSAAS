-- Create saas_invoices table to track payments from Tenants to Super Admin
CREATE TABLE IF NOT EXISTS saas_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  invoice_number TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'paid', -- paid, pending, failed
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  payment_method TEXT, -- cash, bank_transfer, upi, etc.
  items JSONB DEFAULT '[]', -- Array of items { description, amount }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;

-- Policies
-- Super Admin can view all invoices
CREATE POLICY "Super admins can view all saas_invoices" ON saas_invoices
  FOR SELECT USING (auth.jwt() ->> 'role' = 'super_admin');

-- Super Admin can insert invoices
CREATE POLICY "Super admins can insert saas_invoices" ON saas_invoices
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'super_admin');

-- Tenants (Gym Owners) can view their own invoices
CREATE POLICY "Gym owners can view their own saas_invoices" ON saas_invoices
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
    auth.jwt() ->> 'role' = 'gym_owner'
  );
