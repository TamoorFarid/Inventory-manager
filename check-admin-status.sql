-- Check if the admin user exists and has the correct role
SELECT 
  id,
  email,
  username,
  role,
  deleted_at,
  created_at
FROM public.profiles
WHERE email = 'admin@sunpulse.com';

-- Check if the is_admin function works for the current user
SELECT private.is_admin() as is_current_user_admin;

-- Check auth.users metadata
SELECT 
  id,
  email,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE email = 'admin@sunpulse.com';
