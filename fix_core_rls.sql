-- DEFINITIVE FIX for DATA VISIBILITY (RLS)
-- Ensure 'users_profile' based checks are applied to ALL core tables.

-- 1. Memberships (Crucial for Member Details showing Plan Name/Price)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gym staff can view memberships" ON public.memberships;
DROP POLICY IF EXISTS "Gym owners can manage memberships" ON public.memberships;

CREATE POLICY "Gym staff can view memberships" ON public.memberships
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

CREATE POLICY "Gym owners can manage memberships" ON public.memberships
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- 2. Members (Crucial for listing members)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gym staff can view members" ON public.members;
DROP POLICY IF EXISTS "Gym owners can manage members" ON public.members;
DROP POLICY IF EXISTS "Members can view their own data" ON public.members;

-- Staff/Owner View Policy
CREATE POLICY "Gym staff can view members" ON public.members
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- Owner Manage Policy
CREATE POLICY "Gym owners can manage members" ON public.members
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- Member Self-View (Optional, keep for portal)
CREATE POLICY "Members can view their own data" ON public.members
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- 3. Payments (Crucial for 'Amount' / Payment History)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gym staff can view payments" ON public.payments;
DROP POLICY IF EXISTS "Gym owners can manage payments" ON public.payments;

CREATE POLICY "Gym staff can view payments" ON public.payments
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

CREATE POLICY "Gym owners can manage payments" ON public.payments
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- 4. Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Gym staff can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Gym staff can create attendance" ON public.attendance;

CREATE POLICY "Gym staff can view attendance" ON public.attendance
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

CREATE POLICY "Gym staff can create attendance" ON public.attendance
    FOR INSERT WITH CHECK (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- 5. Branches (Just in case)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners and Managers can manage branches" ON public.branches;
DROP POLICY IF EXISTS "Staff and Members can view branches" ON public.branches;

CREATE POLICY "Staff can view branches" ON public.branches
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

CREATE POLICY "Owners can manage branches" ON public.branches
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- 6. Services (Just in case)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners and Managers can manage services" ON public.services;
DROP POLICY IF EXISTS "Staff and Members can view services" ON public.services;

CREATE POLICY "Staff can view services" ON public.services
    FOR SELECT USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

CREATE POLICY "Owners can manage services" ON public.services
    FOR ALL USING (
        tenant_id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid())
    );

-- Grant Permissions
GRANT ALL ON public.memberships TO authenticated;
GRANT ALL ON public.members TO authenticated;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.attendance TO authenticated;
GRANT ALL ON public.branches TO authenticated;
GRANT ALL ON public.services TO authenticated;
