-- =====================================================
-- CREATE ADMIN USER
-- Run this AFTER running schema.sql
-- Replace the values below with your admin credentials
-- =====================================================

-- STEP 1: Create admin user via Supabase Dashboard
-- Go to: Authentication > Users > Add User
-- Email: admin@yourdomain.com
-- Password: your-secure-password
-- Check "Auto Confirm User"

-- STEP 2: After creating the user, run this SQL to update the role to admin
-- Replace 'admin@yourdomain.com' with your actual admin email

UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';

-- =====================================================
-- VERIFY ADMIN USER
-- =====================================================
SELECT id, email, full_name, role, is_active 
FROM user_profiles 
WHERE role = 'admin';

-- =====================================================
-- ALTERNATIVE: Create admin user via SQL (Advanced)
-- Note: This requires knowing the password hash format
-- It's easier to create via Dashboard then update role
-- =====================================================
