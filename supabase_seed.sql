-- Seed data for Gym Management SaaS
-- This script populates the database with sample data for testing

-- Insert sample tenants (gyms)
INSERT INTO tenants (name, slug, address, phone, email, timezone, currency) VALUES
('FitLife Premium Gym', 'fitlife-premium', 
 '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'::jsonb,
 '+1-555-0123', 'info@fitlife.com', 'America/New_York', 'USD'),

('PowerHouse Fitness', 'powerhouse-fitness',
 '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210"}'::jsonb,
 '+1-555-0456', 'hello@powerhouse.com', 'America/Los_Angeles', 'USD'),

('Elite Sports Club', 'elite-sports',
 '{"street": "789 Park Blvd", "city": "Chicago", "state": "IL", "zip": "60601"}'::jsonb,
 '+1-555-0789', 'contact@elite.com', 'America/Chicago', 'USD'),

('Wellness Center Pro', 'wellness-pro',
 '{"street": "321 Health St", "city": "Miami", "state": "FL", "zip": "33101"}'::jsonb,
 '+1-555-0321', 'admin@wellness.com', 'America/New_York', 'USD'),

('Iron Temple Gym', 'iron-temple',
 '{"street": "654 Muscle Ave", "city": "Houston", "state": "TX", "zip": "77001"}'::jsonb,
 '+1-555-0654', 'info@irontemple.com', 'America/Chicago', 'USD');

-- Insert membership plans for each gym
INSERT INTO memberships (tenant_id, name, description, duration_days, price_cents, currency, perks) 
SELECT 
  t.id as tenant_id,
  name,
  description,
  duration_days,
  price_cents,
  'USD' as currency,
  perks
FROM tenants t
CROSS JOIN (
  VALUES
  ('Basic Plan', 'Access to basic gym facilities', 30, 2999, '["Gym Access", "Basic Equipment", "Locker Room"]'::jsonb),
  ('Premium Plan', 'Full access with classes', 30, 5999, '["Gym Access", "All Equipment", "Group Classes", "Sauna", "Nutrition Consultation"]'::jsonb),
  ('Elite Plan', 'Premium plus personal training', 30, 9999, '["Gym Access", "All Equipment", "Group Classes", "Sauna", "Personal Training", "Nutrition Plan", "Priority Booking"]'::jsonb),
  ('Annual Basic', 'Basic plan with annual discount', 365, 29999, '["Gym Access", "Basic Equipment", "Locker Room", "Annual Discount"]'::jsonb),
  ('Annual Premium', 'Premium plan with annual discount', 365, 59999, '["Gym Access", "All Equipment", "Group Classes", "Sauna", "Nutrition Consultation", "Annual Discount"]'::jsonb)
) AS plans(name, description, duration_days, price_cents, perks);

-- Insert sample trainers
INSERT INTO trainers (tenant_id, full_name, email, phone, bio, specialties, hourly_rate_cents, is_active) 
SELECT 
  t.id as tenant_id,
  trainer_name,
  email,
  phone,
  bio,
  specialties,
  hourly_rate_cents,
  true as is_active
FROM tenants t
CROSS JOIN (
  VALUES
  ('Mike Johnson', 'mike@trainer.com', '+1-555-1001', 'Certified personal trainer with 10 years experience', '{"Strength Training", "Weight Loss", "Bodybuilding"}'::text[], 7500),
  ('Sarah Davis', 'sarah@trainer.com', '+1-555-1002', 'Yoga instructor and fitness coach', '{"Yoga", "Pilates", "Flexibility"}'::text[], 6500),
  ('Carlos Rodriguez', 'carlos@trainer.com', '+1-555-1003', 'Former athlete specializing in sports performance', '{"Sports Performance", "Speed Training", "Agility"}'::text[], 8000),
  ('Emma Wilson', 'emma@trainer.com', '+1-555-1004', 'Nutritionist and fitness expert', '{"Nutrition", "Weight Management", "Functional Training"}'::text[], 7000),
  ('James Brown', 'james@trainer.com', '+1-555-1005', 'CrossFit certified trainer', '{"CrossFit", "HIIT", "Endurance"}'::text[], 7200)
) AS trainers_data(trainer_name, email, phone, bio, specialties, hourly_rate_cents);

-- Insert sample members (we'll need to create auth users first)
-- For now, let's create some basic member records without auth users
INSERT INTO members (tenant_id, member_code, full_name, email, phone, dob, gender, address, emergency_contact, current_plan_id, status) 
SELECT 
  t.id as tenant_id,
  'M' || LPAD((ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY random()))::text, 4, '0') as member_code,
  name,
  email,
  phone,
  dob,
  gender,
  address,
  emergency_contact,
  (SELECT id FROM memberships m WHERE m.tenant_id = t.id ORDER BY RANDOM() LIMIT 1),
  CASE WHEN RANDOM() > 0.1 THEN 'active' ELSE 'inactive' END as status
FROM tenants t
CROSS JOIN (
  VALUES
  ('John Smith', 'john@member.com', '+1-555-2001', '1990-05-15', 'male', '{"street": "111 Elm St", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Jane Smith", "phone": "+1-555-2002", "relationship": "Spouse"}'::jsonb),
  ('Lisa Anderson', 'lisa@member.com', '+1-555-2003', '1985-08-22', 'female', '{"street": "222 Pine Ave", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Tom Anderson", "phone": "+1-555-2004", "relationship": "Husband"}'::jsonb),
  ('David Kim', 'david@member.com', '+1-555-2005', '1992-03-10', 'male', '{"street": "333 Oak Dr", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Maria Kim", "phone": "+1-555-2006", "relationship": "Sister"}'::jsonb),
  ('Jennifer Lee', 'jennifer@member.com', '+1-555-2007', '1988-11-30', 'female', '{"street": "444 Maple St", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Robert Lee", "phone": "+1-555-2008", "relationship": "Brother"}'::jsonb),
  ('Michael Chen', 'michael@member.com', '+1-555-2009', '1995-07-18', 'male', '{"street": "555 Cedar Ln", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Lisa Chen", "phone": "+1-555-2010", "relationship": "Mother"}'::jsonb),
  ('Amanda Taylor', 'amanda@member.com', '+1-555-2011', '1983-12-05', 'female', '{"street": "666 Birch Rd", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Mark Taylor", "phone": "+1-555-2012", "relationship": "Husband"}'::jsonb),
  ('Robert Wilson', 'robert@member.com', '+1-555-2013', '1987-04-25', 'male', '{"street": "777 Spruce Way", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Susan Wilson", "phone": "+1-555-2014", "relationship": "Wife"}'::jsonb),
  ('Jessica Martinez', 'jessica@member.com', '+1-555-2015', '1991-09-14', 'female', '{"street": "888 Willow Ct", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Carlos Martinez", "phone": "+1-555-2016", "relationship": "Father"}'::jsonb),
  ('Daniel Thompson', 'daniel@member.com', '+1-555-2017', '1989-01-20', 'male', '{"street": "999 Ash Blvd", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Maria Thompson", "phone": "+1-555-2018", "relationship": "Wife"}'::jsonb),
  ('Michelle Garcia', 'michelle@member.com', '+1-555-2019', '1993-06-12', 'female', '{"street": "111 Poplar St", "city": "Local City", "state": "ST", "zip": "12345"}'::jsonb, '{"name": "Luis Garcia", "phone": "+1-555-2020", "relationship": "Brother"}'::jsonb)
) AS members_data(name, email, phone, dob, gender, address, emergency_contact);

-- Insert sample workout plans
INSERT INTO workouts (tenant_id, name, description, exercises, created_by, difficulty, estimated_duration_minutes) 
SELECT 
  t.id as tenant_id,
  workout_name,
  description,
  exercises,
  NULL as created_by,
  difficulty,
  estimated_duration_minutes
FROM tenants t
CROSS JOIN (
  VALUES
  ('Beginner Full Body', 'Perfect starter workout for all fitness levels', '[{"name": "Push-ups", "sets": 3, "reps": "10-15", "rest": 60}, {"name": "Bodyweight Squats", "sets": 3, "reps": "15-20", "rest": 60}, {"name": "Plank", "sets": 3, "reps": "30-60s", "rest": 60}, {"name": "Jumping Jacks", "sets": 3, "reps": "20-30", "rest": 60}]'::jsonb, 'beginner', 30),
  ('Strength Building', 'Build muscle and increase strength', '[{"name": "Barbell Squats", "sets": 4, "reps": "8-12", "rest": 90}, {"name": "Bench Press", "sets": 4, "reps": "8-12", "rest": 90}, {"name": "Deadlifts", "sets": 3, "reps": "8-10", "rest": 120}, {"name": "Pull-ups", "sets": 3, "reps": "6-12", "rest": 90}, {"name": "Overhead Press", "sets": 3, "reps": "8-12", "rest": 90}]'::jsonb, 'intermediate', 45),
  ('HIIT Cardio Blast', 'High-intensity interval training', '[{"name": "Burpees", "sets": 4, "reps": "30s on/30s off", "rest": 0}, {"name": "Mountain Climbers", "sets": 4, "reps": "30s on/30s off", "rest": 0}, {"name": "High Knees", "sets": 4, "reps": "30s on/30s off", "rest": 0}, {"name": "Jump Squats", "sets": 4, "reps": "30s on/30s off", "rest": 0}]'::jsonb, 'advanced', 20),
  ('Core Crusher', 'Strengthen your core muscles', '[{"name": "Plank Variations", "sets": 3, "reps": "45s each", "rest": 30}, {"name": "Russian Twists", "sets": 3, "reps": "20-30", "rest": 30}, {"name": "Bicycle Crunches", "sets": 3, "reps": "20-30", "rest": 30}, {"name": "Dead Bug", "sets": 3, "reps": "10-15 each side", "rest": 30}]'::jsonb, 'intermediate', 25),
  ('Flexibility & Mobility', 'Improve flexibility and joint mobility', '[{"name": "Dynamic Warm-up", "sets": 1, "reps": "5-10 minutes", "rest": 0}, {"name": "Hip Flexor Stretch", "sets": 2, "reps": "30s each leg", "rest": 0}, {"name": "Shoulder Mobility", "sets": 2, "reps": "10-15 each arm", "rest": 0}, {"name": "Spinal Twists", "sets": 2, "reps": "10-15 each side", "rest": 0}, {"name": "Hamstring Stretch", "sets": 2, "reps": "30s each leg", "rest": 0}]'::jsonb, 'beginner', 35)
) AS workouts_data(workout_name, description, exercises, difficulty, estimated_duration_minutes);

-- Insert sample diet plans
INSERT INTO diet_plans (tenant_id, name, description, meals, target_calories, dietary_restrictions) 
SELECT 
  t.id as tenant_id,
  plan_name,
  description,
  meals,
  target_calories,
  dietary_restrictions
FROM tenants t
CROSS JOIN (
  VALUES
  ('Weight Loss Plan', 'Balanced diet for healthy weight loss', '[{"name": "Breakfast", "foods": "Oatmeal with berries, Greek yogurt", "calories": 350}, {"name": "Snack", "foods": "Apple with almond butter", "calories": 200}, {"name": "Lunch", "foods": "Grilled chicken salad with quinoa", "calories": 450}, {"name": "Snack", "foods": "Protein shake with banana", "calories": 200}, {"name": "Dinner", "foods": "Baked salmon with roasted vegetables", "calories": 400}]'::jsonb, 1600, '{"Low Carb", "High Protein"}'::text[]),
  ('Muscle Gain Diet', 'High protein diet for muscle building', '[{"name": "Breakfast", "foods": "6 egg whites, whole wheat toast, avocado", "calories": 500}, {"name": "Snack", "foods": "Protein shake with oats", "calories": 350}, {"name": "Lunch", "foods": "Lean beef with brown rice and broccoli", "calories": 600}, {"name": "Snack", "foods": "Greek yogurt with nuts", "calories": 300}, {"name": "Dinner", "foods": "Chicken breast with sweet potato", "calories": 550}]'::jsonb, 2300, '{"High Protein"}'::text[]),
  ('Maintenance Plan', 'Balanced diet for weight maintenance', '[{"name": "Breakfast", "foods": "Whole grain cereal with milk and fruit", "calories": 400}, {"name": "Snack", "foods": "Mixed nuts and berries", "calories": 250}, {"name": "Lunch", "foods": "Turkey sandwich with salad", "calories": 500}, {"name": "Snack", "foods": "Yogurt with granola", "calories": 200}, {"name": "Dinner", "foods": "Fish with vegetables and rice", "calories": 450}]'::jsonb, 1800, '{}'::text[]),
  ('Vegetarian Plan', 'Plant-based nutrition plan', '[{"name": "Breakfast", "foods": "Tofu scramble with vegetables", "calories": 400}, {"name": "Snack", "foods": "Hummus with carrot sticks", "calories": 200}, {"name": "Lunch", "foods": "Lentil curry with brown rice", "calories": 500}, {"name": "Snack", "foods": "Protein smoothie with spinach", "calories": 250}, {"name": "Dinner", "foods": "Chickpea stir-fry with quinoa", "calories": 450}]'::jsonb, 1800, '{"Vegetarian"}'::text[]),
  ('Keto Diet Plan', 'Low-carb ketogenic diet', '[{"name": "Breakfast", "foods": "Bacon and eggs with avocado", "calories": 600}, {"name": "Snack", "foods": "Cheese and nuts", "calories": 200}, {"name": "Lunch", "foods": "Salmon with cauliflower rice", "calories": 550}, {"name": "Snack", "foods": "Hard-boiled eggs", "calories": 150}, {"name": "Dinner", "foods": "Steak with buttered vegetables", "calories": 500}]'::jsonb, 2000, '{"Keto", "Low Carb", "High Fat"}'::text[])
) AS diet_plans_data(plan_name, description, meals, target_calories, dietary_restrictions);

-- Insert sample attendance records for the last 30 days
INSERT INTO attendance (tenant_id, member_id, checkin_at, checkout_at)
SELECT 
  m.tenant_id,
  m.id as member_id,
  checkin_at,
  checkin_at + INTERVAL '1-3 hours' * RANDOM() as checkout_at
FROM members m
CROSS JOIN LATERAL (
  SELECT 
    NOW() - INTERVAL '1 day' * (RANDOM() * 30) as checkin_at
  FROM generate_series(1, floor(random() * 15 + 5)::int)
) AS attendance_data(checkin_at)
WHERE m.status = 'active';

-- Insert sample payments
INSERT INTO payments (tenant_id, member_id, membership_id, amount_cents, currency, provider, status, paid_at)
SELECT 
  m.tenant_id,
  m.id as member_id,
  m.current_plan_id as membership_id,
  (SELECT price_cents FROM memberships WHERE id = m.current_plan_id),
  'USD' as currency,
  CASE WHEN RANDOM() > 0.8 THEN 'cash' ELSE 'stripe' END as provider,
  CASE 
    WHEN RANDOM() > 0.9 THEN 'failed'
    WHEN RANDOM() > 0.95 THEN 'refunded'
    ELSE 'paid' 
  END as status,
  NOW() - INTERVAL '1 day' * (RANDOM() * 90) as paid_at
FROM members m
WHERE m.current_plan_id IS NOT NULL
AND RANDOM() > 0.3; -- Not all members have payments

-- Insert sample trainer availability slots
INSERT INTO trainer_slots (trainer_id, tenant_id, day_of_week, start_time, end_time, is_recurring)
SELECT 
  t.id as trainer_id,
  t.tenant_id,
  day_of_week,
  start_time,
  end_time,
  true as is_recurring
FROM trainers t
CROSS JOIN (
  VALUES
  (1, '09:00:00', '11:00:00'), -- Monday
  (1, '14:00:00', '16:00:00'), -- Monday
  (2, '10:00:00', '12:00:00'), -- Tuesday
  (2, '15:00:00', '17:00:00'), -- Tuesday
  (3, '08:00:00', '10:00:00'), -- Wednesday
  (3, '16:00:00', '18:00:00'), -- Wednesday
  (4, '09:00:00', '11:00:00'), -- Thursday
  (4, '13:00:00', '15:00:00'), -- Thursday
  (5, '10:00:00', '12:00:00'), -- Friday
  (5, '14:00:00', '16:00:00'), -- Friday
  (6, '09:00:00', '11:00:00'), -- Saturday
  (0, '10:00:00', '12:00:00')  -- Sunday
) AS slots(day_of_week, start_time, end_time)
WHERE RANDOM() > 0.3; -- Not all trainers work all days

-- Insert some sample member workout assignments
INSERT INTO member_workouts (member_id, workout_id, assigned_by, assigned_at)
SELECT 
  m.id as member_id,
  w.id as workout_id,
  NULL as assigned_by,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30) as assigned_at
FROM members m
JOIN workouts w ON w.tenant_id = m.tenant_id
WHERE RANDOM() > 0.7; -- Only assign to some members

-- Insert some sample member diet assignments
INSERT INTO member_diets (member_id, diet_plan_id, assigned_by, assigned_at, started_at)
SELECT 
  m.id as member_id,
  d.id as diet_plan_id,
  NULL as assigned_by,
  NOW() - INTERVAL '1 day' * (RANDOM() * 30) as assigned_at,
  NOW() - INTERVAL '1 day' * (RANDOM() * 20) as started_at
FROM members m
JOIN diet_plans d ON d.tenant_id = m.tenant_id
WHERE RANDOM() > 0.8; -- Only assign to few members

-- Insert sample notifications
INSERT INTO notifications (tenant_id, user_id, type, title, message)
SELECT 
  m.tenant_id,
  m.user_id,
  CASE 
    WHEN RANDOM() > 0.8 THEN 'payment'
    WHEN RANDOM() > 0.6 THEN 'membership'
    WHEN RANDOM() > 0.4 THEN 'workout'
    ELSE 'general'
  END as type,
  CASE 
    WHEN type = 'payment' THEN 'Payment Reminder'
    WHEN type = 'membership' THEN 'Membership Update'
    WHEN type = 'workout' THEN 'Workout Reminder'
    ELSE 'General Notification'
  END as title,
  CASE 
    WHEN type = 'payment' THEN 'Your membership payment is due soon. Please update your payment method.'
    WHEN type = 'membership' THEN 'Your membership will expire in 7 days. Consider renewing early.'
    WHEN type = 'workout' THEN 'Don\'t forget about your scheduled workout session tomorrow.'
    ELSE 'Welcome to our gym! We\'re excited to have you as a member.'
  END as message
FROM members m
WHERE m.user_id IS NOT NULL AND RANDOM() > 0.5;

-- Update member plan expiration dates
UPDATE members 
SET plan_expires_at = CASE 
  WHEN status = 'active' THEN NOW() + INTERVAL '1 day' * (random() * 60 + 30)
  ELSE NOW() - INTERVAL '1 day' * (random() * 30 + 1)
END
WHERE current_plan_id IS NOT NULL;