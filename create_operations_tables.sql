-- VISITORS (Non-member entry)
CREATE TABLE visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    visit_purpose TEXT, -- 'Inquiry', 'Guest', 'Vendor'
    visit_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    out_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- COMPLAINTS
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can manage their own visitors" ON visitors FOR ALL USING (tenant_id = (SELECT tenant_id FROM users_profile WHERE id = auth.uid()));
CREATE POLICY "Tenants can manage their own complaints" ON complaints FOR ALL USING (tenant_id = (SELECT tenant_id FROM users_profile WHERE id = auth.uid()));

CREATE TRIGGER update_complaints_modtime BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_modified_column();
