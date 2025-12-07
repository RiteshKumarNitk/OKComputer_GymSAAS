-- Allow Gym Owners to update their own tenant details
CREATE POLICY "Gym Owners can update their own tenant" ON public.tenants
FOR UPDATE USING (
    id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid() AND role = 'gym_owner')
)
WITH CHECK (
    id IN (SELECT tenant_id FROM public.users_profile WHERE id = auth.uid() AND role = 'gym_owner')
);

-- Ensure columns exist (just in case)
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS registered_address TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#000000';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#ffffff';

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
