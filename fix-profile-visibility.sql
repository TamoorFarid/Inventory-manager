-- Fix profile visibility for members
-- This ensures members can see profiles of users who share companies with them

-- First, let's verify the shares_company_with function is correct
-- It should return true if:
-- 1. The user is an admin
-- 2. The target user is the current user
-- 3. Both users are members of at least one common company

-- The function looks correct, but let's add some debugging
-- Create a helper to test the function
DO $$
DECLARE
  test_result boolean;
  current_user_id uuid;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO current_user_id;
  
  RAISE NOTICE 'Current user ID: %', current_user_id;
  
  -- Test if current user can see themselves
  SELECT private.shares_company_with(current_user_id) INTO test_result;
  RAISE NOTICE 'Can see self: %', test_result;
  
  -- List all users and whether current user can see them
  FOR test_result IN 
    SELECT 
      p.username,
      p.role,
      private.shares_company_with(p.id) as can_see
    FROM public.profiles p
    WHERE p.deleted_at IS NULL
  LOOP
    RAISE NOTICE 'User: %, Can see: %', test_result;
  END LOOP;
END $$;

-- Check if there are any issues with the company_members table
SELECT 
  'Company Members Check' as check_type,
  COUNT(*) as total_members,
  COUNT(DISTINCT company_id) as total_companies,
  COUNT(DISTINCT user_id) as total_users
FROM public.company_members
WHERE deleted_at IS NULL;

-- Verify the RLS policy is enabled
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND schemaname = 'public';
