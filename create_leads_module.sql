-- Ensure function exists
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'trial', 'converted', 'lost')),
    source TEXT DEFAULT 'walk-in', -- walk-in, referral, social_media, etc.
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id), -- staff member assigned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Tenants can manage their own leads" ON leads;
CREATE POLICY "Tenants can manage their own leads" ON leads
    FOR ALL
    USING (
        tenant_id = (SELECT tenant_id FROM users_profile WHERE id = auth.uid())
    );

-- Trigger for update_at
DROP TRIGGER IF EXISTS update_leads_modtime ON leads;
CREATE TRIGGER update_leads_modtime
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
