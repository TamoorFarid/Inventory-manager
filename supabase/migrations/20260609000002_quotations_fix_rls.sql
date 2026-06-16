-- Fix RLS policies for quotations using a SECURITY DEFINER helper function.
-- The original inline EXISTS subqueries had ambiguous column references in
-- the WITH CHECK clause (quotations.company_id not correctly resolved).

create or replace function public.user_can_access_company(p_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1 from public.company_members
    where company_id = p_company_id
      and user_id = auth.uid()
      and deleted_at is null
  ) or exists (
    select 1 from public.companies
    where id = p_company_id
      and created_by = auth.uid()
      and deleted_at is null
  );
$$;

drop policy if exists "quotations_select_company_members" on public.quotations;
drop policy if exists "quotations_insert_company_members" on public.quotations;
drop policy if exists "quotations_update_company_members" on public.quotations;
drop policy if exists "quotation_items_select" on public.quotation_items;
drop policy if exists "quotation_items_insert" on public.quotation_items;
drop policy if exists "quotation_items_delete" on public.quotation_items;

create policy "quotations_select_company_members"
  on public.quotations for select to authenticated
  using (
    deleted_at is null
    and public.user_can_access_company(company_id)
  );

create policy "quotations_insert_company_members"
  on public.quotations for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.user_can_access_company(company_id)
  );

create policy "quotations_update_company_members"
  on public.quotations for update to authenticated
  using (
    deleted_at is null
    and public.user_can_access_company(company_id)
  )
  with check (updated_by = auth.uid());

create policy "quotation_items_select"
  on public.quotation_items for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and q.deleted_at is null
        and public.user_can_access_company(q.company_id)
    )
  );

create policy "quotation_items_insert"
  on public.quotation_items for insert to authenticated
  with check (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and q.deleted_at is null
        and public.user_can_access_company(q.company_id)
    )
  );

create policy "quotation_items_delete"
  on public.quotation_items for delete to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id = quotation_id
        and q.deleted_at is null
        and public.user_can_access_company(q.company_id)
    )
  );
