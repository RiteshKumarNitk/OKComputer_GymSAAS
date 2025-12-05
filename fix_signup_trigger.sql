-- Fix handle_new_user trigger to respect metadata for role and tenant_id

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'member';
  v_tenant_id uuid;
BEGIN
  -- Check if role is provided in metadata
  IF NEW.raw_user_meta_data ->> 'role' IS NOT NULL THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data ->> 'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'member'; -- Fallback if invalid role
    END;
  END IF;

  -- Check if tenant_id is provided in metadata
  IF NEW.raw_user_meta_data ->> 'tenant_id' IS NOT NULL THEN
    BEGIN
      v_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_tenant_id := NULL; -- Fallback if invalid uuid
    END;
  END IF;

  INSERT INTO users_profile (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name', 
    v_role, 
    v_tenant_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
