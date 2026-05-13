-- COMPREHENSIVE POLICY FIX - Rebuild all policies from scratch

-- Step 1: Disable RLS temporarily
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN 
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'companies' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SELECT policy (for viewing companies)
CREATE POLICY "companies_select"
ON public.companies
FOR SELECT
TO authenticated
USING (
  deleted_at IS NULL
  AND (
    -- User is admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'::public.app_role
        AND profiles.deleted_at IS NULL
    )
    OR
    -- User is a member of the company
    EXISTS (
      SELECT 1 FROM public.company_members
      WHERE company_members.company_id = companies.id
        AND company_members.user_id = auth.uid()
        AND company_members.deleted_at IS NULL
    )
  )
);

-- Step 5: Create INSERT policy (for creating companies)
CREATE POLICY "companies_insert"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
);

-- Step 6: Create UPDATE policy (for updating AND archiving companies)
-- This is the critical one for your archive operation
CREATE POLICY "companies_update"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  -- Can see the row to update it (either not deleted, or we're the one updating it)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
)
WITH CHECK (
  -- Can update to any state (including setting deleted_at)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.app_role
      AND profiles.deleted_at IS NULL
  )
);

-- Step 7: Verify all policies were created
SELECT 
  policyname,
  cmd,
  permissive,
  CASE 
    WHEN cmd = 'SELECT' THEN 'View companies (active only)'
    WHEN cmd = 'INSERT' THEN 'Create companies (admin only)'
    WHEN cmd = 'UPDATE' THEN 'Update/Archive companies (admin only)'
    ELSE 'Other'
  END as description
FROM pg_policies
WHERE tablename = 'companies'
  AND schemaname = 'public'
ORDER BY cmd;

-- Step 8: Verify admin user
SELECT 
  id,
  email,
  role,
  deleted_at,
  '✓ Ready' as status
FROM public.profiles
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35'
  AND role = 'admin'::public.app_role
  AND deleted_at IS NULL;
