-- TEST IF YOU CAN SELECT THE COMPANY BEFORE UPDATING

-- Check if you're authenticated
SELECT 
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '✗ NOT AUTHENTICATED'
    ELSE '✓ Authenticated as: ' || auth.uid()::text
  END as auth_status;

-- Try to SELECT the company you're trying to archive
SELECT 
  id,
  name,
  deleted_at,
  created_by,
  'Can see this company' as status
FROM public.companies
WHERE id = 'd6922ce4-b164-45cd-80fa-e8d69c5887d6';

-- If the above returns no rows, the SELECT policy is blocking you
-- If it returns the row, then the issue is with the UPDATE policy

-- Check what the SELECT policy allows
SELECT 
  policyname,
  cmd,
  qual as using_clause
FROM pg_policies
WHERE tablename = 'companies'
  AND cmd = 'SELECT';
