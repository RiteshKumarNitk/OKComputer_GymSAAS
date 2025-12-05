-- Manually confirm a user's email address
-- Run this script to bypass email verification for a specific user.

-- Replace 'YOUR_EMAIL_HERE' with the email address you want to confirm.
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'riteshkumar.nitk21@gmail.com'; -- Example email, change this!
