-- Move created_by / updated_by assignment into a server-side trigger.
-- The INSERT policy no longer checks client-supplied values against auth.uid(),
-- which was the root cause of the 42501 RLS violation.

create or replace function public.auto_set_quotation_audit()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  new.est_id     := 'EST-' || lpad(nextval('public.quotation_est_id_seq')::text, 4, '0');
  new.created_by := auth.uid();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists quotations_auto_est_id on public.quotations;
drop trigger if exists quotations_auto_audit  on public.quotations;

create trigger quotations_auto_audit
  before insert on public.quotations
  for each row execute function public.auto_set_quotation_audit();

drop policy if exists "quotations_insert_company_members" on public.quotations;

create policy "quotations_insert_company_members"
  on public.quotations for insert to authenticated
  with check (
    public.user_can_access_company(company_id)
  );
