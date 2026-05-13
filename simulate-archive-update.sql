-- SIMULATE THE EXACT ARCHIVE UPDATE

-- First, let's see what company we're trying to archive
SELECT 
  id,
  name,
  deleted_at,
  created_by,
  'Current state' as status
FROM public.companies
WHERE id = 'd6922ce4-b164-45cd-80fa-e8d69c5887d6';

-- Check if you're authenticated
SELECT 
  auth.uid() as current_user,
  CASE 
    WHEN auth.uid() IS NULL THEN '✗ NOT AUTHENTICATED - This is the problem!'
    WHEN auth.uid() = '7af3dbbb-5345-4243-8433-3a055246fa35' THEN '✓ Authenticated as expected admin'
    ELSE '⚠ Authenticated as different user: ' || auth.uid()::text
  END as auth_status;

-- Try the exact update that the app is doing
-- This will fail if the policy is wrong
UPDATE public.companies
SET 
  deleted_at = NOW(),
  deleted_by = '7af3dbbb-5345-4243-8433-3a055246fa35',
  updated_by = '7af3dbbb-5345-4243-8433-3a055246fa35'
WHERE id = 'd6922ce4-b164-45cd-80fa-e8d69c5887d6'
RETURNING id, name, deleted_at, 'Successfully archived' as result;

-- If the above fails, it means the policy is still blocking
-- If it succeeds, the issue is with authentication in your app
