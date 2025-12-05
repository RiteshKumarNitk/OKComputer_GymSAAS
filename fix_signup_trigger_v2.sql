-- Fix handle_new_user trigger to be more robust and handle FK violations

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'member';
  v_tenant_id uuid;
  v_tenant_exists boolean;
BEGIN
  -- 1. Handle Role
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'member';
    END;
  END IF;

  -- 2. Handle Tenant ID
  IF NEW.raw_user_meta_data ->> 'tenant_id' IS NOT NULL THEN
    BEGIN
      v_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
      
      -- Verify tenant exists to prevent FK violation error
      SELECT EXISTS (SELECT 1 FROM tenants WHERE id = v_tenant_id) INTO v_tenant_exists;
      
      IF NOT v_tenant_exists THEN
        v_tenant_id := NULL; -- Silently fallback to NULL if tenant doesn't exist
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_tenant_id := NULL;
    END;
  END IF;

  -- 3. Insert Profile
  INSERT INTO users_profile (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name', 
    v_role, 
    v_tenant_id
  );
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but allow user creation (optional: or raise exception to block)
  -- For now, we want to ensure the Auth User is created even if profile fails, 
  -- but Supabase Auth wraps this transaction, so if we fail here, Auth fails.
  -- We'll try to insert a basic profile as fallback.
  BEGIN
    INSERT INTO users_profile (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', 'member');
  EXCEPTION WHEN OTHERS THEN
    -- If even fallback fails, we can't do much.
    RAISE WARNING 'Failed to create user profile for %', NEW.id;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
