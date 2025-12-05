-- CHECK DATA INTEGRITY
-- List users who are gym_owners but have no tenant_id
SELECT * FROM users_profile 
WHERE role = 'gym_owner' AND tenant_id IS NULL;

-- List all tenants
SELECT * FROM tenants;

-- Check if there are any orphan tenants (no owner linked in users_profile)
-- or users who should own a tenant but don't.
