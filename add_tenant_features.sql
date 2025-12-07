-- Add 'features' column to tenants table to control enabled modules
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '["dashboard", "members", "trainers", "front-desk", "branches", "services", "attendance", "schedule", "billing", "workouts", "diet-plans", "analytics", "reports", "settings"]'::jsonb;

-- Comment: The 'features' column will store an array of strings representing enabled modules.
-- Example: ['dashboard', 'members', 'billing']

-- Update existing tenants to have all features by default so we don't break them
UPDATE public.tenants 
SET features = '["dashboard", "members", "trainers", "front-desk", "branches", "services", "attendance", "schedule", "billing", "workouts", "diet-plans", "analytics", "reports", "settings"]'::jsonb 
WHERE features IS NULL;
