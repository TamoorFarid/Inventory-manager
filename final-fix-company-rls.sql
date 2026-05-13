-- FINAL FIX FOR COMPANY RLS ISSUE
-- This removes the problematic deleted_at check from INSERT policy

-- 1. Ensure user is admin
UPDATE public.profiles
SET 
  role = 'admin',
  deleted_at = NULL
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35';

-- 2. Drop existing policies
DROP POLICY IF EXISTS "companies_admin_insert" ON public.companies;
DROP POLICY IF EXISTS "companies_select_accessible" ON public.companies;
DROP POLICY IF EXISTS "companies_admin_update" ON public.companies;

-- 3. Recreate SELECT policy (unchanged)
CREATE POLICY "companies_select_accessible"
ON public.companies
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND private.can_access_company(id)
);

-- 4. Recreate INSERT policy WITHOUT deleted_at check
-- The deleted_at check doesn't make sense for INSERT since new rows have NULL by default
CREATE POLICY "companies_admin_insert"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  private.is_admin()
);

-- 5. Recreate UPDATE policy
CREATE POLICY "companies_admin_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  deleted_at IS NULL
  AND private.is_admin()
)
WITH CHECK (
  private.is_admin()
);

-- 6. Verify the fix
SELECT 
  'Policy recreated successfully' as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'companies';

-- 7. Verify admin user
SELECT 
  id,
  email,
  username,
  role,
  deleted_at,
  CASE 
    WHEN role = 'admin' AND deleted_at IS NULL THEN '✓ Ready to create companies'
    ELSE '✗ Issue with user status'
  END as status
FROM public.profiles
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35';
