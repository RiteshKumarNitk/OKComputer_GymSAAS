-- ===================================================================
-- DATABASE PERFORMANCE OPTIMIZATION
-- Adding indexes to improve RLS and Query performance
-- ===================================================================

-- 1. Users Profile
CREATE INDEX IF NOT EXISTS idx_users_profile_tenant_id ON users_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_role ON users_profile(role);

-- 2. Members
CREATE INDEX IF NOT EXISTS idx_members_tenant_id ON members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

-- 3. Memberships
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships(tenant_id);

-- 4. Branches & Services
CREATE INDEX IF NOT EXISTS idx_branches_tenant_id ON branches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON services(tenant_id);

-- 5. Attendance & Payments
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);

-- 6. Trainers
CREATE INDEX IF NOT EXISTS idx_trainers_tenant_id ON trainers(tenant_id);

-- 7. Analyze to update query planner statistics
ANALYZE users_profile;
ANALYZE members;
ANALYZE memberships;
ANALYZE branches;
ANALYZE services;
