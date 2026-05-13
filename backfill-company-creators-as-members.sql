-- Backfill: Add existing company creators as members
-- Run this after applying the main migration to fix existing data

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

-- Verify the backfill
SELECT 
  'Backfill Complete' as status,
  COUNT(*) as companies_checked,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 
      FROM public.company_members cm 
      WHERE cm.company_id = c.id 
        AND cm.user_id = c.created_by 
        AND cm.deleted_at IS NULL
    )
  ) as creators_are_members
FROM public.companies c
WHERE c.deleted_at IS NULL;

-- Show any companies where creator is still not a member (should be 0)
SELECT 
  c.name as company_name,
  creator.username as creator_username,
  'Creator NOT a member - ISSUE!' as status
FROM public.companies c
JOIN public.profiles creator ON creator.id = c.created_by
WHERE c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.company_members cm 
    WHERE cm.company_id = c.id 
      AND cm.user_id = c.created_by 
      AND cm.deleted_at IS NULL
  );
