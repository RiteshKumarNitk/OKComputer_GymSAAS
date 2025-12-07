-- 1. Fix RLS for Tenants (Allow Gym Owners to read their own features)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;

CREATE POLICY "Users can view their own tenant" ON public.tenants
FOR SELECT
USING (
    id = (
        SELECT tenant_id 
        FROM public.users_profile 
        WHERE id = auth.uid()
        LIMIT 1
    )
    OR
    EXISTS (
        SELECT 1 FROM public.users_profile 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
);

GRANT SELECT ON public.tenants TO authenticated;

-- 2. Ensure users_profile is readable (Prerequisite for the above subquery)
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.users_profile
FOR SELECT
USING (auth.uid() = id);

GRANT SELECT ON public.users_profile TO authenticated;

-- 3. Sync Owner Name from Profile to Tenant (Fix "Name not reflecting" issue)
-- First, manual sync for existing records
UPDATE public.tenants t
SET owner_name = up.full_name
FROM public.users_profile up
WHERE t.id = up.tenant_id AND up.role = 'gym_owner';

-- 4. Create Trigger to keep name synced in future
CREATE OR REPLACE FUNCTION public.sync_owner_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the user is a gym_owner
  IF NEW.role = 'gym_owner' THEN
    UPDATE public.tenants
    SET owner_name = NEW.full_name
    WHERE id = NEW.tenant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_profile_update ON public.users_profile;

CREATE TRIGGER on_user_profile_update
AFTER UPDATE OF full_name ON public.users_profile
FOR EACH ROW
EXECUTE FUNCTION public.sync_owner_name();

-- 5. Force update 'features' for 'rav332211@gmail.com' just in case (optional debugging)
-- (We assume the Super Admin mutation works, so we trust the DB state)
