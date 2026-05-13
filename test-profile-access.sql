-- Test profile visibility for members
-- This script helps debug why members see "Unknown" for other users

-- Check if the shares_company_with function works correctly
SELECT 
  p.id,
  p.username,
  p.email,
  p.role,
  private.shares_company_with(p.id) as can_see_profile
FROM public.profiles p
WHERE p.deleted_at IS NULL
ORDER BY p.username;

-- Check company memberships
SELECT 
  cm.id,
  cm.company_id,
  c.name as company_name,
  cm.user_id,
  p.username,
  cm.deleted_at
FROM public.company_members cm
JOIN public.companies c ON c.id = cm.company_id
JOIN public.profiles p ON p.id = cm.user_id
WHERE cm.deleted_at IS NULL
  AND c.deleted_at IS NULL
ORDER BY c.name, p.username;

-- Test the profiles RLS policy
-- Run this as a member user to see what profiles they can access
SELECT 
  id,
  username,
  email,
  role
FROM public.profiles
WHERE deleted_at IS NULL;
