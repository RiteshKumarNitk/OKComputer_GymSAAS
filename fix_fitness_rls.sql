-- DEFINITELY FIX RLS POLICIES for Fitness Modules
-- Using users_profile table is more reliable than JWT metadata if sync is not perfect.

-- 1. Schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage their own schedules" ON public.schedules;
CREATE POLICY "Tenants can manage their own schedules" ON public.schedules
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profile WHERE id = auth.uid()
        )
    );

-- 2. Workouts
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage their own workouts" ON public.workouts;
CREATE POLICY "Tenants can manage their own workouts" ON public.workouts
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profile WHERE id = auth.uid()
        )
    );

-- 3. Diet Plans
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage their own diet_plans" ON public.diet_plans;
CREATE POLICY "Tenants can manage their own diet_plans" ON public.diet_plans
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profile WHERE id = auth.uid()
        )
    );

-- 4. Member Workouts
ALTER TABLE public.member_workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage member assignments" ON public.member_workouts;
CREATE POLICY "Tenants can manage member assignments" ON public.member_workouts
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profile WHERE id = auth.uid()
        )
    );

-- 5. Member Diets
ALTER TABLE public.member_diets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can manage member diet assignments" ON public.member_diets;
CREATE POLICY "Tenants can manage member diet assignments" ON public.member_diets
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profile WHERE id = auth.uid()
        )
    );

-- 6. Trainers (Fixing the missing update/insert issue)
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenants can view their own trainers" ON public.trainers;
DROP POLICY IF EXISTS "Tenants can manage their own trainers" ON public.trainers;

CREATE POLICY "Tenants can manage their own trainers" ON public.trainers
    USING (
        tenant_id IN (
            SELECT tenant_id FROM public.users_profile WHERE id = auth.uid()
        )
    );

-- Grant permissions again just in case
GRANT ALL ON public.schedules TO authenticated;
GRANT ALL ON public.workouts TO authenticated;
GRANT ALL ON public.diet_plans TO authenticated;
GRANT ALL ON public.member_workouts TO authenticated;
GRANT ALL ON public.member_diets TO authenticated;
GRANT ALL ON public.trainers TO authenticated;
