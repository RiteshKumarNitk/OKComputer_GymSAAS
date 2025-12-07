-- Create Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('rent', 'utilities', 'salary', 'maintenance', 'equipment', 'marketing', 'other')),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can manage their own expenses" ON expenses
    FOR ALL
    USING (
        tenant_id = (SELECT tenant_id FROM users_profile WHERE id = auth.uid())
    );

-- Trigger for update_at
CREATE TRIGGER update_expenses_modtime
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
