-- SHOW THE EXACT POLICY DEFINITION

-- Get the exact policy definition from pg_policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'companies' 
  AND cmd = 'UPDATE';

-- Also check the underlying pg_policy table for more details
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pol.polpermissive as permissive,
  pg_get_expr(pol.polqual, pol.polrelid) as using_clause,
  pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_clause
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pc.relname = 'companies'
  AND pn.nspname = 'public'
  AND pol.polcmd = 'w'; -- 'w' means UPDATE
