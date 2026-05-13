-- COMPREHENSIVE FIX FOR COMPANY CREATION ISSUE
-- Run this entire script in Supabase SQL Editor

-- Step 1: Ensure the admin user has the correct role
UPDATE public.profiles
SET 
  role = 'admin',
  deleted_at = NULL
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35';

-- Step 2: Drop and recreate the companies insert policy using the helper function
DROP POLICY IF EXISTS "companies_admin_insert" ON public.companies;

CREATE POLICY "companies_admin_insert"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  private.is_admin()
);

-- Step 3: Also ensure the update policy uses the helper function
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

CREATE POLICY "companies_admin_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND private.is_admin()
)
WITH CHECK (
  private.is_admin()
);

-- Step 4: Verify the admin user
SELECT 
  id,
  email,
  username,
  role,
  deleted_at,
  'Admin user verified' as status
FROM public.profiles
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35'
  AND role = 'admin'
  AND deleted_at IS NULL;

-- Step 5: Verify the helper function works correctly
-- This checks the function definition
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_admin'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'private');

-- Step 6: Test if you're currently authenticated as admin
-- Run this while logged in as the user
SELECT 
  auth.uid() as current_user_id,
  private.is_admin() as is_admin,
  CASE 
    WHEN private.is_admin() THEN '✓ You can insert companies'
    ELSE '✗ You cannot insert companies'
  END as permission_status;
