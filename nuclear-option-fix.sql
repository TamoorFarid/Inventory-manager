-- NUCLEAR OPTION - Completely rebuild the companies RLS policies

-- 1. Disable RLS temporarily
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL policies on companies
DROP POLICY IF EXISTS "companies_select_accessible" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

-- 3. Re-enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 4. Recreate SELECT policy
CREATE POLICY "companies_select_accessible"
ON public.companies
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    -- User is admin
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
        AND profiles.deleted_at IS NULL
    )
    OR
    -- User is a member of the company
    EXISTS (
      SELECT 1
      FROM public.company_members
      WHERE company_members.company_id = companies.id
        AND company_members.user_id = auth.uid()
        AND company_members.deleted_at IS NULL
    )
  )
);

-- 5. Recreate INSERT policy with explicit table references
CREATE POLICY "companies_admin_insert"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
);

-- 6. Recreate UPDATE policy
CREATE POLICY "companies_admin_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
);

-- 7. Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Should allow admins and company members'
    WHEN cmd = 'INSERT' THEN 'Should allow admins only'
    WHEN cmd = 'UPDATE' THEN 'Should allow admins only'
    ELSE 'Other'
  END as expected_behavior
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY cmd, policyname;

-- 8. Verify the admin user one more time
SELECT 
  id,
  email,
  role,
  role::text as role_as_text,
  deleted_at,
  '✓ User is ready' as status
FROM public.profiles
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35'
  AND role = 'admin'::public.app_role
  AND deleted_at IS NULL;
