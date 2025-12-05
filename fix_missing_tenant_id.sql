-- ===================================================================
-- FIX MISSING TENANT IDs FOR GYM OWNERS
-- ===================================================================

DO $$
DECLARE
    r RECORD;
    v_tenant_id UUID;
    v_new_tenant_id UUID;
BEGIN
    -- Loop through all gym owners with missing tenant_id
    FOR r IN 
        SELECT * FROM users_profile 
        WHERE role = 'gym_owner' AND tenant_id IS NULL 
    LOOP
        RAISE NOTICE 'Fixing user: % (%)', r.full_name, r.id;

        -- 1. Check if they already own a tenant
        -- We assume 'owner_user_id' column exists on tenants table
        BEGIN
            SELECT id INTO v_tenant_id 
            FROM tenants 
            WHERE owner_user_id = r.id 
            LIMIT 1;
        EXCEPTION WHEN undefined_column THEN
            -- If column doesn't exist, we can't check ownership this way
            v_tenant_id := NULL;
        END;

        IF v_tenant_id IS NOT NULL THEN
            RAISE NOTICE 'Found existing tenant: %', v_tenant_id;
            
            UPDATE users_profile 
            SET tenant_id = v_tenant_id 
            WHERE id = r.id;
            
        ELSE
            -- 2. Create a new tenant if none exists
            RAISE NOTICE 'Creating new tenant for user';
            
            INSERT INTO tenants (
                name, 
                slug, 
                owner_user_id,
                primary_color,
                secondary_color
            )
            VALUES (
                COALESCE(r.full_name, 'My Gym') || '''s Gym', 
                'gym-' || substr(md5(random()::text), 1, 8),
                r.id,
                '#000000',
                '#ffffff'
            )
            RETURNING id INTO v_new_tenant_id;
            
            UPDATE users_profile 
            SET tenant_id = v_new_tenant_id 
            WHERE id = r.id;
            
        END IF;
    END LOOP;
END $$;

-- Ensure subscription columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_status') THEN
        ALTER TABLE tenants ADD COLUMN subscription_status text DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE tenants ADD COLUMN subscription_expires_at timestamptz;
    END IF;
END $$;
