-- SUPABASE RECOMMENDED POLICY PATTERN

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

-- Create UPDATE policy using Supabase's recommended pattern
-- Using the helper function that already exists
CREATE POLICY "companies_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (private.is_admin())
WITH CHECK (private.is_admin());

-- Verify the helper function exists and works
SELECT 
  proname as function_name,
  'Function exists' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'private' 
  AND p.proname = 'is_admin';

-- Verify the policy
SELECT 
  policyname,
  cmd,
  'Using private.is_admin() helper' as note
FROM pg_policies
WHERE tablename = 'companies'
  AND cmd = 'UPDATE';
