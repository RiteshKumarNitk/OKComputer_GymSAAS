INSERT INTO tenants (name, slug, address, phone, email, timezone, currency) VALUES
('FitZone Gym Jaipur', 'fitzone-jaipur',
 '{"street": "Ajmer Road", "city": "Jaipur", "state": "Rajasthan", "pin": "302021"}'::jsonb,
 '+91-9829012345', 'contact@fitzone.in', 'Asia/Kolkata', 'INR'),

('Muscle Factory Delhi', 'musclefactory-delhi',
 '{"street": "Rohini Sector 3", "city": "Delhi", "state": "Delhi", "pin": "110085"}'::jsonb,
 '+91-9876543210', 'info@musclefactory.in', 'Asia/Kolkata', 'INR'),

('PowerHouse Gym Mumbai', 'powerhouse-mumbai',
 '{"street": "Andheri West", "city": "Mumbai", "state": "Maharashtra", "pin": "400053"}'::jsonb,
 '+91-9134567890', 'support@powerhouse.in', 'Asia/Kolkata', 'INR'),

('StrongLife Gym Bangalore', 'stronglife-bangalore',
 '{"street": "Koramangala 5th Block", "city": "Bengaluru", "state": "Karnataka", "pin": "560095"}'::jsonb,
 '+91-9988776655', 'hello@stronglife.in', 'Asia/Kolkata', 'INR'),

('Iron Temple Hyderabad', 'iron-temple-hyd',
 '{"street": "Gachibowli", "city": "Hyderabad", "state": "Telangana", "pin": "500032"}'::jsonb,
 '+91-9000012345', 'admin@irontemple.in', 'Asia/Kolkata', 'INR');


INSERT INTO memberships (tenant_id, name, description, duration_days, price_cents, perks)
SELECT 
  t.id,
  plan_name,
  description,
  duration_days,
  price_rupees * 100,  -- converting to paisa
  perks
FROM tenants t
CROSS JOIN (
  VALUES
    ('Basic Plan', 'Basic access to gym floor & equipment', 30, 799, '["Gym Access"]'::jsonb),
    ('Premium Plan', 'Gym + Cardio + Group Classes', 30, 1499, '["Gym", "Cardio", "Classes"]'::jsonb),
    ('Elite Plan', 'Premium + Personal Trainer', 30, 2999, '["Everything", "Personal Trainer"]'::jsonb),
    ('Annual Plan', 'Yearly discounted plan', 365, 14999, '["All Access", "Annual Discount"]'::jsonb)
) AS p(plan_name, description, duration_days, price_rupees, perks);

INSERT INTO trainers (tenant_id, full_name, email, phone, bio, specialties, hourly_rate_cents)
SELECT 
  t.id,
  full_name,
  email,
  phone,
  bio,
  specialties,
  rate * 100
FROM tenants t
CROSS JOIN (
  VALUES
    ('Rohit Sharma', 'rohit.trainer@fit.in', '+91-8844332211', 'Certified fitness coach with 8 years experience', '{"Weight Training","Strength"}'::text[], 600),
    ('Priya Verma', 'priya.verma@fit.in', '+91-8899776655', 'Yoga & aerobics expert', '{"Yoga","Aerobics"}'::text[], 500),
    ('Amit Singh', 'amit.singh@fit.in', '+91-7766554433', 'Crossfit level-2 trainer', '{"Crossfit","HIIT"}'::text[], 700),
    ('Neha Gupta', 'neha.gupta@fit.in', '+91-9812345678', 'Sports nutrition specialist', '{"Nutrition","Fat Loss"}'::text[], 550),
    ('Vikram Rao', 'vikram.rao@fit.in', '+91-9022334455', 'Strength & conditioning coach', '{"Strength","Conditioning"}'::text[], 650)
) AS trainer_data(full_name, email, phone, bio, specialties, rate);


INSERT INTO members (
  tenant_id, member_code, full_name, email, phone, dob, gender, address,
  emergency_contact, current_plan_id, status
)
SELECT
  t.id,
  'MB' || floor(random()*9000 + 1000)::text,
  full_name,
  email,
  phone,
  dob,
  gender,
  address,
  emergency_contact,
  (SELECT id FROM memberships WHERE tenant_id = t.id ORDER BY random() LIMIT 1),
  'active'
FROM tenants t
CROSS JOIN (
  VALUES
    ('Arjun Mehta', 'arjun.mehta@example.com', '+91-9988223344', '1992-07-15', 'male',
     '{"street": "Mansarovar", "city": "Jaipur"}'::jsonb,
     '{"name": "Rekha Mehta", "phone": "+91-9988223345"}'::jsonb),

    ('Simran Kaur', 'simran.kaur@example.com', '+91-9877001122', '1994-03-11', 'female',
     '{"street": "Preet Vihar", "city": "Delhi"}'::jsonb,
     '{"name": "Harjit Kaur", "phone": "+91-9877001123"}'::jsonb),

    ('Ravi Patel', 'ravi.patel@example.com', '+91-9090909090', '1990-11-20', 'male',
     '{"street": "Borivali", "city": "Mumbai"}'::jsonb,
     '{"name": "Meera Patel", "phone": "+91-9090909091"}'::jsonb),

    ('Ayesha Khan', 'ayesha.khan@example.com', '+91-9123456780', '1996-05-02', 'female',
     '{"street": "Indiranagar", "city": "Bangalore"}'::jsonb,
     '{"name": "Sameer Khan", "phone": "+91-9123456781"}'::jsonb),

    ('Sandeep Reddy', 'sandeep.reddy@example.com', '+91-9500123456', '1993-09-30', 'male',
     '{"street": "Madhapur", "city": "Hyderabad"}'::jsonb,
     '{"name": "Rohini Reddy", "phone": "+91-9500123457"}'::jsonb)
) AS member_data(full_name, email, phone, dob, gender, address, emergency_contact);

INSERT INTO attendance (tenant_id, member_id, checkin_at, checkout_at)
SELECT
 m.tenant_id,
 m.id,
 NOW() - (interval '1 day' * (random()*10)),
 NOW() - (interval '1 day' * (random()*10)) + interval '1 hour'
FROM members m
WHERE random() > 0.3;

INSERT INTO payments (tenant_id, member_id, membership_id, amount_cents, currency, provider, status, paid_at)
SELECT 
 m.tenant_id,
 m.id,
 m.current_plan_id,
 (SELECT price_cents FROM memberships WHERE id = m.current_plan_id),
 'INR',
 'razorpay',
 'paid',
 NOW() - interval '1 day' * (random()*40)
FROM members m
WHERE m.current_plan_id IS NOT NULL AND random() > 0.4;

INSERT INTO trainer_slots (trainer_id, tenant_id, day_of_week, start_time, end_time)
SELECT 
  tr.id,
  tr.tenant_id,
  floor(random()*7)::int,
  '07:00',
  '09:00'
FROM trainers tr
WHERE random() > 0.4;

INSERT INTO workouts (tenant_id, name, description, exercises, difficulty, estimated_duration_minutes)
SELECT
 t.id,
 workout_name,
 description,
 exercises,
 difficulty,
 duration
FROM tenants t
CROSS JOIN (
  VALUES
    ('Full Body Beginner', 'Beginner workout', '[{"name": "Squats", "sets": 3, "reps": 15}]'::jsonb, 'easy', 30),
    ('Weight Loss Circuit', 'Fat burning workout', '[{"name": "Burpees", "sets": 3, "reps": 12}]'::jsonb, 'medium', 40),
    ('Strength Training', 'Strength & conditioning', '[{"name": "Deadlift", "sets": 4, "reps": 10}]'::jsonb, 'hard', 45)
) AS w(workout_name, description, exercises, difficulty, duration);

INSERT INTO diet_plans (tenant_id, name, description, meals, target_calories)
SELECT 
 t.id,
 plan_name,
 description,
 meals,
 calories
FROM tenants t
CROSS JOIN (
  VALUES
    ('Indian Weight Loss Plan', 'Healthy low-cal Indian diet',
     '[{"meal":"Breakfast","item":"Poha + Tea"},{"meal":"Lunch","item":"Roti + Dal + Salad"},{"meal":"Dinner","item":"Khichdi"}]'::jsonb, 1500),

    ('High Protein Indian Diet', 'Muscle building diet',
     '[{"meal":"Breakfast","item":"Paneer Sandwich"},{"meal":"Lunch","item":"Rice + Rajma + Egg"},{"meal":"Dinner","item":"Chicken Curry"}]'::jsonb, 2200)
) AS d(plan_name, description, meals, calories);

