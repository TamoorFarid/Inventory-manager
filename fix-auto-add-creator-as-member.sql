-- Fix: Automatically add company creator as a member
-- This ensures that when viewing company details, members can see who created it

-- Create a function to automatically add the creator as a company member
CREATE OR REPLACE FUNCTION private.auto_add_creator_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run on INSERT and when the company is not deleted
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    -- Add the creator as a member of the company
    INSERT INTO public.company_members (
      company_id,
      user_id,
      added_by,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.created_by,
      NEW.created_by,
      timezone('utc', now()),
      timezone('utc', now())
    )
    ON CONFLICT (company_id, user_id) WHERE deleted_at IS NULL
    DO NOTHING; -- If already a member, do nothing
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS companies_auto_add_creator_trigger ON public.companies;
CREATE TRIGGER companies_auto_add_creator_trigger
AFTER INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION private.auto_add_creator_as_member();

-- Backfill: Add existing company creators as members if they aren't already
INSERT INTO public.company_members (
  company_id,
  user_id,
  added_by,
  created_at,
  updated_at
)
SELECT 
  c.id as company_id,
  c.created_by as user_id,
  c.created_by as added_by,
  c.created_at,
  timezone('utc', now()) as updated_at
FROM public.companies c
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.company_members cm 
    WHERE cm.company_id = c.id 
      AND cm.user_id = c.created_by 
      AND cm.deleted_at IS NULL
  )
ON CONFLICT (company_id, user_id) WHERE deleted_at IS NULL
DO NOTHING;

-- Verify the fix
SELECT 
  'Verification' as status,
  c.name as company_name,
  creator.username as creator_username,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM public.company_members cm 
      WHERE cm.company_id = c.id 
        AND cm.user_id = c.created_by 
        AND cm.deleted_at IS NULL
    ) THEN 'Creator is member ✓'
    ELSE 'Creator NOT member ✗'
  END as membership_status
FROM public.companies c
JOIN public.profiles creator ON creator.id = c.created_by
WHERE c.deleted_at IS NULL
ORDER BY c.created_at DESC;
