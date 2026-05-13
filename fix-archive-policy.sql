-- Fix the companies_admin_update policy to allow archiving companies
-- The issue: the USING clause prevents updating rows where deleted_at is not null,
-- which blocks the archiving operation itself

drop policy if exists "companies_admin_update" on public.companies;
create policy "companies_admin_update"
on public.companies
for update
to authenticated
using (
  private.is_admin()
  -- Removed: deleted_at is null
  -- This was preventing the archive operation from working
)
with check (private.is_admin());
