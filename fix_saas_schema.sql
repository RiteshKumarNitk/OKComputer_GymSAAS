-- 1. FORCE Create Tables (if they missed somehow)
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price_inr NUMERIC NOT NULL,
    duration_days INT DEFAULT 365,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.saas_plans(id),
    start_date TIMESTAMPTZ DEFAULT now(),
    end_date TIMESTAMPTZ,
    price_paid_inr NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saas_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id),
    subscription_id UUID REFERENCES public.saas_subscriptions(id),
    invoice_number TEXT UNIQUE,
    amount_inr NUMERIC NOT NULL DEFAULT 0, -- Ensure this column exists
    status TEXT DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Force Add 'amount_inr' column if it was missing for some reason
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_invoices' AND column_name = 'amount_inr') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN amount_inr NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 3. Seed Plans (Idempotent)
INSERT INTO public.saas_plans (name, description, price_inr, duration_days, features)
SELECT 'Silver Plan', 'Basic features for small gyms.', 15000, 365, '["dashboard", "members", "attendance", "billing", "schedule", "reports"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.saas_plans WHERE name = 'Silver Plan');

INSERT INTO public.saas_plans (name, description, price_inr, duration_days, features)
SELECT 'Gold Plan', 'Advanced management including branches.', 20000, 365, '["dashboard", "members", "attendance", "billing", "schedule", "services", "branches", "trainers", "reports"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.saas_plans WHERE name = 'Gold Plan');

INSERT INTO public.saas_plans (name, description, price_inr, duration_days, features)
SELECT 'Platinum Plan', 'Full suite with Diet & Workouts.', 30000, 365, '["dashboard", "members", "attendance", "billing", "schedule", "services", "branches", "trainers", "workouts", "diet-plans", "reports", "analytics", "front-desk", "settings"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.saas_plans WHERE name = 'Platinum Plan');

INSERT INTO public.saas_plans (name, description, price_inr, duration_days, features)
SELECT 'Trial (14 Days)', 'Free trial to explore all features.', 0, 14, '["dashboard", "members", "attendance", "billing", "schedule", "services", "branches", "trainers", "workouts", "diet-plans", "reports", "analytics", "front-desk", "settings"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.saas_plans WHERE name = 'Trial (14 Days)');

-- 4. Enable RLS and Grant Access
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active plans" ON public.saas_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Super Admin all plans" ON public.saas_plans;
CREATE POLICY "Super Admin all plans" ON public.saas_plans FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Super Admin manage subscriptions" ON public.saas_subscriptions;
CREATE POLICY "Super Admin manage subscriptions" ON public.saas_subscriptions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
);

DROP POLICY IF EXISTS "Super Admin manage invoices" ON public.saas_invoices;
CREATE POLICY "Super Admin manage invoices" ON public.saas_invoices FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users_profile WHERE id = auth.uid() AND role = 'super_admin')
);

GRANT ALL ON public.saas_plans TO authenticated;
GRANT ALL ON public.saas_subscriptions TO authenticated;
GRANT ALL ON public.saas_invoices TO authenticated;

-- Refresh schema cache hint (comment)
NOTIFY pgrst, 'reload schema';
