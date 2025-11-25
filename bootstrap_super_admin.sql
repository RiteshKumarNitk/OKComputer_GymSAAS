


INSERT INTO tenants (name, slug)
VALUES ('GymOwl System', 'system')
ON CONFLICT (slug) DO NOTHING;

-- 2. Promote User to Super Admin
DO $$
DECLARE
  v_user_email text := 'riteshkumar.nitk21@gmail.com'; -- <<< SPECIFIC SUPER ADMIN
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  -- Get the User ID from auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
  
  -- Get the System Tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'system';

  IF v_user_id IS NOT NULL THEN
    -- Update Profile
    UPDATE users_profile
    SET 
      role = 'super_admin',
      tenant_id = v_tenant_id,
      full_name = 'Super Admin'
    WHERE id = v_user_id;

    RAISE NOTICE 'User % has been promoted to Super Admin', v_user_email;
  ELSE
    RAISE NOTICE 'User % not found. Please sign up first!', v_user_email;
  END IF;
END $$;