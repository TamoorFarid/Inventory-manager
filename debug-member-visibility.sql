-- Debug why members see "Unknown" for creators/updaters

-- Step 1: Check a specific company and its creator
SELECT 
  c.id as company_id,
  c.name as company_name,
  c.created_by,
  creator.username as creator_username,
  creator.role as creator_role
FROM public.companies c
LEFT JOIN public.profiles creator ON creator.id = c.created_by
WHERE c.deleted_at IS NULL
LIMIT 5;

-- Step 2: Check if creators are members of their own companies
SELECT 
  c.name as company_name,
  c.created_by as creator_id,
  creator.username as creator_username,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM public.company_members cm 
      WHERE cm.company_id = c.id 
        AND cm.user_id = c.created_by 
        AND cm.deleted_at IS NULL
    ) THEN 'YES'
    ELSE 'NO'
  END as creator_is_member
FROM public.companies c
JOIN public.profiles creator ON creator.id = c.created_by
WHERE c.deleted_at IS NULL;

-- Step 3: For each company, show all members
SELECT 
  c.name as company_name,
  p.username,
  p.role,
  cm.created_at as member_since
FROM public.companies c
JOIN public.company_members cm ON cm.company_id = c.id
JOIN public.profiles p ON p.id = cm.user_id
WHERE c.deleted_at IS NULL
  AND cm.deleted_at IS NULL
ORDER BY c.name, p.username;
