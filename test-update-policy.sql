-- TEST UPDATE POLICY

-- 1. Check all current policies on companies table
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- 2. Check if the user is admin
SELECT 
  id,
  email,
  role,
  role::text as role_text,
  deleted_at,
  CASE 
    WHEN role = 'admin'::public.app_role AND deleted_at IS NULL THEN '✓ Is admin'
    ELSE '✗ Not admin or deleted'
  END as admin_status
FROM public.profiles
WHERE id = auth.uid();

-- 3. Test the policy condition for UPDATE
SELECT 
  'Policy check for UPDATE' as test,
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  ) as should_allow_update;

-- 4. Check if there are any other policies that might be blocking
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- 5. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';
