-- FINAL UPDATE FIX - Remove dependency on row state

-- Drop the UPDATE policy
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

-- Create UPDATE policy that doesn't check the row's current state
-- Only checks if the user is admin
CREATE POLICY "companies_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  -- Just check if user is admin, don't check row state
  auth.uid() IN (
    SELECT id 
    FROM public.profiles
    WHERE role = 'admin'::public.app_role
      AND deleted_at IS NULL
  )
)
WITH CHECK (
  -- Just check if user is admin, don't check row state
  auth.uid() IN (
    SELECT id 
    FROM public.profiles
    WHERE role = 'admin'::public.app_role
      AND deleted_at IS NULL
  )
);

-- Verify
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'companies'
  AND cmd = 'UPDATE';

-- Test if the condition works
SELECT 
  auth.uid() as my_id,
  auth.uid() IN (
    SELECT id 
    FROM public.profiles
    WHERE role = 'admin'::public.app_role
      AND deleted_at IS NULL
  ) as can_update;
