-- Fix Foreign Key Constraints to enable Cascade Delete for Tenants

-- 1. users_profile
ALTER TABLE users_profile DROP CONSTRAINT IF EXISTS users_profile_tenant_id_fkey;
ALTER TABLE users_profile ADD CONSTRAINT users_profile_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. memberships
ALTER TABLE memberships DROP CONSTRAINT IF EXISTS memberships_tenant_id_fkey;
ALTER TABLE memberships ADD CONSTRAINT memberships_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 3. members
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_tenant_id_fkey;
ALTER TABLE members ADD CONSTRAINT members_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_tenant_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 5. attendance
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_tenant_id_fkey;
ALTER TABLE attendance ADD CONSTRAINT attendance_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 6. trainers
ALTER TABLE trainers DROP CONSTRAINT IF EXISTS trainers_tenant_id_fkey;
ALTER TABLE trainers ADD CONSTRAINT trainers_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 7. trainer_slots (The one that caused the error)
ALTER TABLE trainer_slots DROP CONSTRAINT IF EXISTS trainer_slots_tenant_id_fkey;
ALTER TABLE trainer_slots ADD CONSTRAINT trainer_slots_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 8. workouts
ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_tenant_id_fkey;
ALTER TABLE workouts ADD CONSTRAINT workouts_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 9. diet_plans
ALTER TABLE diet_plans DROP CONSTRAINT IF EXISTS diet_plans_tenant_id_fkey;
ALTER TABLE diet_plans ADD CONSTRAINT diet_plans_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 10. notifications
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_tenant_id_fkey;
ALTER TABLE notifications ADD CONSTRAINT notifications_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 11. audit_logs
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 12. saas_invoices
ALTER TABLE saas_invoices DROP CONSTRAINT IF EXISTS saas_invoices_tenant_id_fkey;
ALTER TABLE saas_invoices ADD CONSTRAINT saas_invoices_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- 13. branches (Assuming table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'branches') THEN
        ALTER TABLE branches DROP CONSTRAINT IF EXISTS branches_tenant_id_fkey;
        ALTER TABLE branches ADD CONSTRAINT branches_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 14. services (Assuming table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'services') THEN
        ALTER TABLE services DROP CONSTRAINT IF EXISTS services_tenant_id_fkey;
        ALTER TABLE services ADD CONSTRAINT services_tenant_id_fkey 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Also ensure secondary cascades (e.g., members -> member_workouts)
-- member_workouts -> members
ALTER TABLE member_workouts DROP CONSTRAINT IF EXISTS member_workouts_member_id_fkey;
ALTER TABLE member_workouts ADD CONSTRAINT member_workouts_member_id_fkey 
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- member_diets -> members
ALTER TABLE member_diets DROP CONSTRAINT IF EXISTS member_diets_member_id_fkey;
ALTER TABLE member_diets ADD CONSTRAINT member_diets_member_id_fkey 
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- trainer_slots -> trainers
ALTER TABLE trainer_slots DROP CONSTRAINT IF EXISTS trainer_slots_trainer_id_fkey;
ALTER TABLE trainer_slots ADD CONSTRAINT trainer_slots_trainer_id_fkey 
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE;
