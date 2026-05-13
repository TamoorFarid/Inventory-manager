-- Step 1: Check the current profile for this user ID
SELECT 
  id,
  email,
  username,
  role,
  deleted_at
FROM public.profiles
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35';

-- Step 2: If the role is not 'admin', update it
UPDATE public.profiles
SET 
  role = 'admin',
  deleted_at = NULL
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35';

-- Step 3: Verify the update
SELECT 
  id,
  email,
  username,
  role,
  deleted_at
FROM public.profiles
WHERE id = '7af3dbbb-5345-4243-8433-3a055246fa35';

-- Step 4: Test if is_admin works for this user
-- (You need to be logged in as this user to test this)
-- SELECT private.is_admin() as is_admin_check;
