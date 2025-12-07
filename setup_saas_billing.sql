-- 1. SaaS Plans Table (Defines the packages you sell to gym owners)
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_inr NUMERIC NOT NULL, -- Price in Rupees (e.g., 15000)
    duration_days INT DEFAULT 365, -- Default to yearly (365 days)
    features JSONB NOT NULL DEFAULT '[]'::jsonb, -- The modules included in this plan
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. SaaS Subscriptions (Tracks which tenant has which plan)
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.saas_plans(id),
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    price_paid_inr NUMERIC,
    status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'trial'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SaaS Invoices (Generated when a plan is assigned/renewed)
CREATE TABLE IF NOT EXISTS public.saas_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id),
    subscription_id UUID REFERENCES public.saas_subscriptions(id),
    invoice_number TEXT UNIQUE, -- Auto-generated ID (e.g., INV-SAAS-001)
    amount_inr NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Super Admin has full access, Gym Owners can read their own)
-- Plans (Everyone can read active plans, only Admin writes)
CREATE POLICY "Public read active plans" ON public.saas_plans FOR SELECT USING (true);
CREATE POLICY "Super Admin all plans" ON public.saas_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
);

-- Subscriptions
CREATE POLICY "Super Admin manage subscriptions" ON public.saas_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Tenant view own subscription" ON public.saas_subscriptions FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
);

-- Invoices
CREATE POLICY "Super Admin manage invoices" ON public.saas_invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
);
CREATE POLICY "Tenant view own invoices" ON public.saas_invoices FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
);

-- 6. Seed Initial Plans (Standardizing the 15k, 20k, 30k structure)
INSERT INTO public.saas_plans (name, description, price_inr, duration_days, features) VALUES
('Silver Plan', 'Basic features for small gyms.', 15000, 365, '["dashboard", "members", "attendance", "billing", "schedule"]'::jsonb),
('Gold Plan', 'Advanced management including branches.', 20000, 365, '["dashboard", "members", "attendance", "billing", "schedule", "services", "branches", "trainers"]'::jsonb),
('Platinum Plan', 'Full suite with Diet, Workouts, and Reports.', 30000, 365, '["dashboard", "members", "attendance", "billing", "schedule", "services", "branches", "trainers", "workouts", "diet-plans", "reports", "analytics", "front-desk"]'::jsonb),
('Trial (14 Days)', 'Free trial to explore all features.', 0, 14, '["dashboard", "members", "attendance", "billing", "schedule", "services", "branches", "trainers", "workouts", "diet-plans", "reports", "analytics", "front-desk"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON public.saas_plans TO authenticated;
GRANT ALL ON public.saas_subscriptions TO authenticated;
GRANT ALL ON public.saas_invoices TO authenticated;
