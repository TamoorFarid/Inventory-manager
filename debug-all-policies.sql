-- DEBUG ALL POLICIES AND CONSTRAINTS

-- 1. Show ALL policies on companies table (there might be multiple)
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

-- 2. Check if there are any RESTRICTIVE policies (these are AND-ed together)
SELECT 
  polname as policy_name,
  CASE 
    WHEN polpermissive THEN 'PERMISSIVE (OR)'
    ELSE 'RESTRICTIVE (AND) - This could be blocking!'
  END as policy_type,
  CASE polcmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pc.relname = 'companies'
  AND pn.nspname = 'public';

-- 3. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✓ RLS is enabled'
    ELSE '✗ RLS is disabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'companies';

-- 4. Check for any triggers that might be interfering
SELECT 
  tgname as trigger_name,
  tgtype,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid = 'public.companies'::regclass
  AND tgname NOT LIKE 'RI_%'; -- Exclude foreign key triggers

-- 5. Check table owner and permissions
SELECT 
  tableowner,
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'companies'
  AND schemaname = 'public';
