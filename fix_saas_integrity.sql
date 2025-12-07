-- DEFINITIVE REPAIR for SaaS Billing Schema
-- This script safely checks for missing columns and adds them.

-- 1. Ensure 'saas_plans' exists and has basic columns
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_inr NUMERIC NOT NULL,
    features JSONB DEFAULT '[]'::jsonb
);

-- 2. Ensure 'saas_subscriptions' exists
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id),
    plan_id UUID REFERENCES public.saas_plans(id)
);

-- 3. Ensure 'saas_invoices' exists
CREATE TABLE IF NOT EXISTS public.saas_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id)
);

-- 4. ADD MISSING COLUMNS (SAFE ALTER)
DO $$
BEGIN
    -- saas_subscriptions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscriptions' AND column_name = 'price_paid_inr') THEN
        ALTER TABLE public.saas_subscriptions ADD COLUMN price_paid_inr NUMERIC;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscriptions' AND column_name = 'status') THEN
        ALTER TABLE public.saas_subscriptions ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscriptions' AND column_name = 'start_date') THEN
        ALTER TABLE public.saas_subscriptions ADD COLUMN start_date TIMESTAMPTZ DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_subscriptions' AND column_name = 'end_date') THEN
        ALTER TABLE public.saas_subscriptions ADD COLUMN end_date TIMESTAMPTZ;
    END IF;

    -- saas_invoices
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_invoices' AND column_name = 'subscription_id') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN subscription_id UUID REFERENCES public.saas_subscriptions(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_invoices' AND column_name = 'amount_inr') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN amount_inr NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_invoices' AND column_name = 'invoice_number') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN invoice_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_invoices' AND column_name = 'status') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_invoices' AND column_name = 'created_at') THEN
        ALTER TABLE public.saas_invoices ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 5. RELOAD SCHEMA CACHE (Critical for 'Could not find column in schema cache' errors)
NOTIFY pgrst, 'reload schema';
