-- FIX UPDATE POLICY TO ALLOW ARCHIVING (soft delete)

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

-- Recreate UPDATE policy that allows admins to update AND archive companies
CREATE POLICY "companies_admin_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  -- Can update if the row is not deleted (normal update)
  -- OR if we're archiving it (setting deleted_at)
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
)
WITH CHECK (
  -- Admin can update to any state (including setting deleted_at)
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
);

-- Verify the policy
SELECT 
  policyname,
  cmd,
  'Policy allows admins to update and archive companies' as description
FROM pg_policies
WHERE tablename = 'companies' 
  AND policyname = 'companies_admin_update';
