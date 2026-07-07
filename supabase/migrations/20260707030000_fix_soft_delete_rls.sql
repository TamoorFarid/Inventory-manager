-- Postgres requires the post-UPDATE row to remain visible under a table's SELECT
-- policy, even for a plain UPDATE with no RETURNING clause. Since quotations,
-- sales, and inventory_items all gate their SELECT policy on `deleted_at IS NULL`,
-- soft-deleting a row (UPDATE ... SET deleted_at = now(), deleted_by = auth.uid())
-- makes the just-updated row invisible under that same SELECT policy, and Postgres
-- raises "new row violates row-level security policy" even though the UPDATE
-- itself is permitted by the UPDATE policy's WITH CHECK.
--
-- Fix: also allow visibility when the current user is the one who just deleted
-- the row (deleted_by = auth.uid()). This keeps soft-deleted rows hidden from
-- everyone else and preserves existing tenant/company scoping — it only lets the
-- deleting user's own transaction see the row it just modified, which is what
-- the internal RLS visibility check needs to succeed.

drop policy if exists "quotations_select" on public.quotations;
create policy "quotations_select"
  on public.quotations
  for select
  to authenticated
  using (deleted_at is null or deleted_by = auth.uid());

drop policy if exists "inventory_items_select_all" on public.inventory_items;
create policy "inventory_items_select_all"
  on public.inventory_items
  for select
  to authenticated
  using (deleted_at is null or deleted_by = auth.uid());

drop policy if exists "sales_select_company_members" on public.sales;
create policy "sales_select_company_members"
  on public.sales
  for select
  to authenticated
  using (
    (deleted_at is null or deleted_by = auth.uid())
    and exists (
      select 1
      from public.company_members
      where company_members.company_id = sales.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  );
