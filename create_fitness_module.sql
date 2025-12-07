-- Drop tables if they exist to ensure clean slate (Fixes "column does not exist" if table was created incorrectly)
DROP TABLE IF EXISTS public.member_diets;
DROP TABLE IF EXISTS public.member_workouts;
DROP TABLE IF EXISTS public.diet_plans;
DROP TABLE IF EXISTS public.workouts;
DROP TABLE IF EXISTS public.schedules;

-- 1. Schedule / Class Slots Table
CREATE TABLE public.schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE, -- The class type (e.g. Yoga, Zumba)
    trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL, -- Optional trainer
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    max_capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Workouts Templates Table
CREATE TABLE public.workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    difficulty TEXT, -- Beginner, Intermediate, Advanced
    exercises JSONB DEFAULT '[]'::jsonb, -- Array of objects: { name, sets, reps, notes }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Diet Plans Templates Table
CREATE TABLE public.diet_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_calories INTEGER,
    meals JSONB DEFAULT '[]'::jsonb, -- Array of objects: { name, time, items: [] }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Assign Workouts to Members
CREATE TABLE public.member_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- 5. Assign Diet Plans to Members
CREATE TABLE public.member_diets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    diet_plan_id UUID REFERENCES public.diet_plans(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes TEXT
);

-- Enable RLS
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_diets ENABLE ROW LEVEL SECURITY;

-- Policies (Simple: Tenants see their own data)
-- Policies (Simple: Tenants see their own data)
CREATE POLICY "Tenants can manage their own schedules" ON public.schedules
    USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can manage their own workouts" ON public.workouts
    USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can manage their own diet_plans" ON public.diet_plans
    USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can manage member assignments" ON public.member_workouts
    USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

CREATE POLICY "Tenants can manage member diet assignments" ON public.member_diets
    USING (tenant_id = (select (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid));

-- Grant permissions
GRANT ALL ON public.schedules TO authenticated;
GRANT ALL ON public.workouts TO authenticated;
GRANT ALL ON public.diet_plans TO authenticated;
GRANT ALL ON public.member_workouts TO authenticated;
GRANT ALL ON public.member_diets TO authenticated;
