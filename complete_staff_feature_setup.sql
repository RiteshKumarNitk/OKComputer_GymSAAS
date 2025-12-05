-- ==========================================
-- PART 0: HELPER FUNCTIONS
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- PART 1: SCHEMA UPDATES (Staff & Members)
-- ==========================================

-- 1. Add assigned_trainer_id to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS assigned_trainer_id UUID REFERENCES trainers(id);

-- 2. Create front_desk table
CREATE TABLE IF NOT EXISTS front_desk (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  user_id UUID REFERENCES users_profile(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS for front_desk
ALTER TABLE front_desk ENABLE ROW LEVEL SECURITY;

-- 4. Policies for front_desk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gym staff can view front_desk') THEN
    CREATE POLICY "Gym staff can view front_desk" ON front_desk
      FOR SELECT USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
        auth.jwt() ->> 'role' IN ('gym_owner', 'manager', 'trainer', 'frontdesk')
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Gym owners can manage front_desk') THEN
    CREATE POLICY "Gym owners can manage front_desk" ON front_desk
      FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid AND
        auth.jwt() ->> 'role' IN ('gym_owner', 'manager')
      );
  END IF;
END$$;

-- 5. Trigger for updated_at on front_desk
DROP TRIGGER IF EXISTS update_front_desk_updated_at ON front_desk;
CREATE TRIGGER update_front_desk_updated_at BEFORE UPDATE ON front_desk 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- PART 2: FIX USER CREATION & AUTO-LINKING
-- ==========================================

-- 6. Fix handle_new_user to correctly set tenant_id and role from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users_profile (id, email, full_name, role, tenant_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    NEW.raw_user_meta_data ->> 'full_name', 
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'member'),
    (NEW.raw_user_meta_data ->> 'tenant_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Fix existing gym owners who might have missing tenant_id
UPDATE users_profile
SET tenant_id = (SELECT id FROM tenants WHERE owner_user_id = users_profile.id)
WHERE tenant_id IS NULL AND role = 'gym_owner';

-- 8. Auto-link Staff on Signup
-- When a user signs up, check if they are already listed in 'trainers' or 'front_desk' by email.
-- If so, link their user_id and update their role/tenant_id.

CREATE OR REPLACE FUNCTION link_staff_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  existing_trainer_id UUID;
  existing_frontdesk_id UUID;
  staff_tenant_id UUID;
BEGIN
  -- Check Trainers
  SELECT id, tenant_id INTO existing_trainer_id, staff_tenant_id 
  FROM trainers WHERE email = NEW.email LIMIT 1;
  
  IF existing_trainer_id IS NOT NULL THEN
    -- Link user_id in trainers table
    UPDATE trainers SET user_id = NEW.id WHERE id = existing_trainer_id;
    -- Update profile role and tenant
    UPDATE users_profile 
    SET role = 'trainer', 
        tenant_id = staff_tenant_id
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Check Front Desk
  SELECT id, tenant_id INTO existing_frontdesk_id, staff_tenant_id 
  FROM front_desk WHERE email = NEW.email LIMIT 1;
  
  IF existing_frontdesk_id IS NOT NULL THEN
    -- Link user_id in front_desk table
    UPDATE front_desk SET user_id = NEW.id WHERE id = existing_frontdesk_id;
    -- Update profile role and tenant
    UPDATE users_profile 
    SET role = 'frontdesk', 
        tenant_id = staff_tenant_id
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS link_staff_after_profile_creation ON users_profile;

-- Create Trigger
CREATE TRIGGER link_staff_after_profile_creation
  AFTER INSERT ON users_profile
  FOR EACH ROW EXECUTE FUNCTION link_staff_on_signup();
