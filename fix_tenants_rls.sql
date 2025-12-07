-- Allow authenticated users (Gym Owners, Staff) to VIEW their own Tenant's details (including features)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;

CREATE POLICY "Users can view their own tenant" ON public.tenants
FOR SELECT
USING (
    -- Allow if the user's profile points to this tenant
    id IN (
        SELECT tenant_id 
        FROM public.users_profile 
        WHERE id = auth.uid()
    )
    OR
    -- Allow Super Admins (by role check if needed, or if they have unrestricted access usually handled by separate policy or superuser)
    -- Assuming Super Admins are handled by separate policy or are just trusted.
    -- If Super Admin needs to see all:
    EXISTS (
        SELECT 1 FROM public.users_profile 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR
    -- Allow user if they are the owner (by email match) - fallback
    owner_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Grant select permission
GRANT SELECT ON public.tenants TO authenticated;
