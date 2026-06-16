-- Fix: use (select auth.uid()) pattern throughout RLS policies and helper functions.
-- Calling auth.uid() directly can be evaluated at query-plan time before the JWT
-- is bound in PostgREST. Wrapping it in a subquery forces runtime evaluation.
-- This is the pattern recommended by Supabase for all RLS policies.

create or replace function public.user_can_access_company(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.company_members
    where company_id  = p_company_id
      and user_id     = (select auth.uid())
      and deleted_at  is null
  ) or exists (
    select 1 from public.companies
    where id          = p_company_id
      and created_by  = (select auth.uid())
      and deleted_at  is null
  );
$$;

drop policy if exists "quotations_select_company_members" on public.quotations;
drop policy if exists "quotations_insert_company_members" on public.quotations;
drop policy if exists "quotations_update_company_members" on public.quotations;
drop policy if exists "quotation_items_select"            on public.quotation_items;
drop policy if exists "quotation_items_insert"            on public.quotation_items;
drop policy if exists "quotation_items_delete"            on public.quotation_items;

create policy "quotations_select_company_members"
  on public.quotations for select to authenticated
  using (
    deleted_at is null
    and public.user_can_access_company(company_id)
  );

create policy "quotations_insert_company_members"
  on public.quotations for insert to authenticated
  with check (
    public.user_can_access_company(company_id)
  );

create policy "quotations_update_company_members"
  on public.quotations for update to authenticated
  using (
    deleted_at is null
    and public.user_can_access_company(company_id)
  )
  with check ( (select auth.uid()) is not null );

create policy "quotation_items_select"
  on public.quotation_items for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id         = quotation_id
        and q.deleted_at is null
        and public.user_can_access_company(q.company_id)
    )
  );

create policy "quotation_items_insert"
  on public.quotation_items for insert to authenticated
  with check (
    exists (
      select 1 from public.quotations q
      where q.id         = quotation_id
        and q.deleted_at is null
        and public.user_can_access_company(q.company_id)
    )
  );

create policy "quotation_items_delete"
  on public.quotation_items for delete to authenticated
  using (
    exists (
      select 1 from public.quotations q
      where q.id         = quotation_id
        and q.deleted_at is null
        and public.user_can_access_company(q.company_id)
    )
  );
