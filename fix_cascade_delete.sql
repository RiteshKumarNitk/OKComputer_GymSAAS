-- ===================================================================
-- FIX CASCADE DELETE
-- Enables deleting a tenant by automatically deleting all related data.
-- ===================================================================

-- 1. Memberships
ALTER TABLE memberships
  DROP CONSTRAINT IF EXISTS memberships_tenant_id_fkey,
  ADD CONSTRAINT memberships_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Members
ALTER TABLE members
  DROP CONSTRAINT IF EXISTS members_tenant_id_fkey,
  ADD CONSTRAINT members_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. Users Profile (Careful: This deletes the profile, but not the Auth User)
ALTER TABLE users_profile
  DROP CONSTRAINT IF EXISTS users_profile_tenant_id_fkey,
  ADD CONSTRAINT users_profile_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Branches
ALTER TABLE branches
  DROP CONSTRAINT IF EXISTS branches_tenant_id_fkey,
  ADD CONSTRAINT branches_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. Services
ALTER TABLE services
  DROP CONSTRAINT IF EXISTS services_tenant_id_fkey,
  ADD CONSTRAINT services_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. Trainers
ALTER TABLE trainers
  DROP CONSTRAINT IF EXISTS trainers_tenant_id_fkey,
  ADD CONSTRAINT trainers_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 7. Attendance
ALTER TABLE attendance
  DROP CONSTRAINT IF EXISTS attendance_tenant_id_fkey,
  ADD CONSTRAINT attendance_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 8. Payments
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey,
  ADD CONSTRAINT payments_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 9. Workouts
ALTER TABLE workouts
  DROP CONSTRAINT IF EXISTS workouts_tenant_id_fkey,
  ADD CONSTRAINT workouts_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 10. Diet Plans
ALTER TABLE diet_plans
  DROP CONSTRAINT IF EXISTS diet_plans_tenant_id_fkey,
  ADD CONSTRAINT diet_plans_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 11. Notifications
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_tenant_id_fkey,
  ADD CONSTRAINT notifications_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
