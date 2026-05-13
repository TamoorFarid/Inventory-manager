-- TEMPORARY PERMISSIVE UPDATE POLICY FOR TESTING

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

-- Create a very permissive policy that just checks if user is authenticated
CREATE POLICY "companies_admin_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (true)  -- Allow updating any row
WITH CHECK (true);  -- Allow updating to any state

-- Verify
SELECT 
  policyname,
  cmd,
  'TEMPORARY - Allows all authenticated users to update' as warning
FROM pg_policies
WHERE tablename = 'companies' 
  AND policyname = 'companies_admin_update';

-- Now try your archive operation from the app
-- If it works: the issue is with the admin check
-- If it still fails: the issue is with authentication
