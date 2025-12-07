-- Create Trainers Table
CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Link to auth user if they have a login
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    bio TEXT,
    specialties TEXT[], -- Array of strings
    hourly_rate_cents INTEGER,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own trainers" ON public.trainers
    FOR SELECT USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can manage their own trainers" ON public.trainers
    FOR ALL USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Grant permissions
GRANT ALL ON public.trainers TO authenticated;
