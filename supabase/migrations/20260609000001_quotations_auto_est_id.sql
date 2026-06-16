-- Auto-generate EST IDs for quotations using a global sequence
-- Format: EST-0001, EST-0002, ...

create sequence if not exists public.quotation_est_id_seq start 1;

create or replace function public.auto_set_est_id()
returns trigger
language plpgsql
as $$
begin
  new.est_id := 'EST-' || lpad(nextval('public.quotation_est_id_seq')::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists quotations_auto_est_id on public.quotations;
create trigger quotations_auto_est_id
  before insert on public.quotations
  for each row execute function public.auto_set_est_id();
