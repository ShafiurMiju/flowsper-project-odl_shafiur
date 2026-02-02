-- =====================================================
-- FIX: Remove problematic trigger and create admin manually
-- Run this to fix the database error when creating users
-- =====================================================

-- STEP 1: Drop the existing trigger (it's causing errors)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- STEP 2: Create admin user manually
-- Replace 'your-email@example.com' with your actual email
-- =====================================================

-- First, create the user in Supabase Dashboard:
-- Go to: Authentication > Users > Add user
-- Email: admin@yourdomain.com
-- Password: your-secure-password
-- Check "Auto Confirm User"
-- Click "Create user"

-- Then run this to get the user's ID and create profile:
-- (After creating the user in the dashboard, run the queries below)

-- View all auth users to get the ID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Create admin profile (replace 'PASTE_USER_ID_HERE' with the actual user ID from above)
-- INSERT INTO user_profiles (id, email, full_name, role)
-- VALUES (
--   'PASTE_USER_ID_HERE',
--   'admin@yourdomain.com',
--   'Admin User',
--   'admin'
-- );

-- =====================================================
-- STEP 3: Keep the trigger disabled for manual user creation
-- We'll handle profile creation in the app code instead
-- =====================================================

-- For programmatic user creation (via API), profiles will be created
-- automatically in the createSubAccount function

-- =====================================================
-- VERIFY: Check your admin user
-- =====================================================
SELECT up.*, au.email as auth_email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'admin';
