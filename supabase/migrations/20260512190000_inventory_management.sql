create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'app_role'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.app_role as enum ('admin', 'member');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null,
  role public.app_role not null default 'member',
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where deleted_at is null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where deleted_at is null;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid not null references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists companies_created_at_idx
  on public.companies (created_at desc);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_by uuid not null references public.profiles (id),
  removed_by uuid references public.profiles (id),
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create unique index if not exists company_members_active_unique_idx
  on public.company_members (company_id, user_id)
  where deleted_at is null;

create index if not exists company_members_company_idx
  on public.company_members (company_id)
  where deleted_at is null;

create index if not exists company_members_user_idx
  on public.company_members (user_id)
  where deleted_at is null;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  description text,
  max_selling_price numeric(12, 2) not null check (max_selling_price > 0),
  min_selling_price numeric(12, 2) not null check (min_selling_price > 0),
  quantity integer not null default 0 check (quantity >= 0),
  created_by uuid not null references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint inventory_items_price_window_check
    check (max_selling_price >= min_selling_price)
);

create index if not exists inventory_items_company_idx
  on public.inventory_items (company_id)
  where deleted_at is null;

create index if not exists inventory_items_company_title_idx
  on public.inventory_items (company_id, lower(title))
  where deleted_at is null;

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items (id),
  sold_by uuid not null references public.profiles (id),
  quantity_sold integer not null check (quantity_sold > 0),
  selling_price_per_unit numeric(12, 2) not null check (selling_price_per_unit > 0),
  total_amount numeric(14, 2) generated always as (
    round((quantity_sold::numeric * selling_price_per_unit), 2)
  ) stored,
  updated_by uuid references public.profiles (id),
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists sales_company_idx
  on public.sales (company_id, created_at desc)
  where deleted_at is null;

create index if not exists sales_inventory_item_idx
  on public.sales (inventory_item_id, created_at desc)
  where deleted_at is null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  message text not null,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  deleted_by uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists notifications_company_idx
  on public.notifications (company_id, created_at desc)
  where deleted_at is null;

create table if not exists public.notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists notification_reads_unique_idx
  on public.notification_reads (notification_id, user_id);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  description text not null,
  actor_id uuid references public.profiles (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_logs_company_idx
  on public.activity_logs (company_id, created_at desc);

create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and deleted_at is null
  );
$$;

create or replace function private.company_is_active(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.companies
    where id = target_company_id
      and deleted_at is null
  );
$$;

create or replace function private.can_access_company(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select private.company_is_active(target_company_id)
    and (
      private.is_admin()
      or exists (
        select 1
        from public.company_members
        where company_id = target_company_id
          and user_id = (select auth.uid())
          and deleted_at is null
      )
    );
$$;

create or replace function private.shares_company_with(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select private.is_admin()
    or target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.company_members source_membership
      join public.company_members target_membership
        on target_membership.company_id = source_membership.company_id
      join public.companies companies
        on companies.id = source_membership.company_id
      where source_membership.user_id = (select auth.uid())
        and target_membership.user_id = target_user_id
        and source_membership.deleted_at is null
        and target_membership.deleted_at is null
        and companies.deleted_at is null
    );
$$;

create or replace function private.can_access_notification(target_notification_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.notifications
    where id = target_notification_id
      and deleted_at is null
      and private.can_access_company(company_id)
  );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function private.insert_activity_log(
  p_company_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_description text,
  p_actor_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_logs (
    company_id,
    entity_type,
    entity_id,
    action,
    description,
    actor_id,
    metadata
  )
  values (
    p_company_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_description,
    p_actor_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

create or replace function private.capture_activity_log()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  new_row jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  old_row jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  actor_id uuid := coalesce(
    nullif(new_row ->> 'updated_by', '')::uuid,
    nullif(new_row ->> 'created_by', '')::uuid,
    nullif(new_row ->> 'added_by', '')::uuid,
    nullif(new_row ->> 'removed_by', '')::uuid,
    nullif(new_row ->> 'deleted_by', '')::uuid,
    nullif(new_row ->> 'sold_by', '')::uuid,
    nullif(old_row ->> 'updated_by', '')::uuid,
    nullif(old_row ->> 'created_by', '')::uuid,
    nullif(old_row ->> 'added_by', '')::uuid,
    nullif(old_row ->> 'removed_by', '')::uuid,
    nullif(old_row ->> 'deleted_by', '')::uuid,
    nullif(old_row ->> 'sold_by', '')::uuid,
    (select auth.uid())
  );
  company_id uuid := coalesce(
    nullif(new_row ->> 'company_id', '')::uuid,
    nullif(old_row ->> 'company_id', '')::uuid,
    case
      when tg_argv[0] = 'company' then coalesce(
        nullif(new_row ->> 'id', '')::uuid,
        nullif(old_row ->> 'id', '')::uuid
      )
      else null
    end
  );
  entity_id uuid := coalesce(
    nullif(new_row ->> 'id', '')::uuid,
    nullif(old_row ->> 'id', '')::uuid
  );
  entity_name text := coalesce(
    nullif(new_row ->> 'title', ''),
    nullif(old_row ->> 'title', ''),
    nullif(new_row ->> 'name', ''),
    nullif(old_row ->> 'name', ''),
    tg_argv[0]
  );
  action_name text;
  description_text text;
begin
  if tg_argv[0] = 'company' then
    if tg_op = 'INSERT' then
      action_name := 'created';
      description_text := format('Created company "%s".', entity_name);
    elsif tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
      action_name := 'deleted';
      description_text := format('Archived company "%s".', entity_name);
    else
      action_name := 'updated';
      description_text := format('Updated company "%s".', entity_name);
    end if;
  elsif tg_argv[0] = 'company_member' then
    if tg_op = 'INSERT' then
      action_name := 'member_added';
      description_text := 'Added a company member.';
    elsif tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
      action_name := 'member_removed';
      description_text := 'Removed a company member.';
    else
      return coalesce(new, old);
    end if;
  elsif tg_argv[0] = 'inventory_item' then
    if tg_op = 'INSERT' then
      action_name := 'created';
      description_text := format('Added inventory item "%s".', entity_name);
    elsif tg_op = 'UPDATE' and old.deleted_at is null and new.deleted_at is not null then
      action_name := 'deleted';
      description_text := format('Deleted inventory item "%s".', entity_name);
    else
      action_name := 'updated';
      description_text := format('Updated inventory item "%s".', entity_name);
    end if;
  else
    return coalesce(new, old);
  end if;

  perform private.insert_activity_log(
    company_id,
    tg_argv[0],
    entity_id,
    action_name,
    description_text,
    actor_id,
    case
      when tg_op = 'DELETE' then old_row
      else new_row
    end
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.record_sale(
  p_company_id uuid,
  p_inventory_item_id uuid,
  p_quantity_sold integer,
  p_selling_price_per_unit numeric
)
returns public.sales
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid := (select auth.uid());
  target_item public.inventory_items;
  recorded_sale public.sales;
  actor_name text;
begin
  if actor_id is null then
    raise exception 'Authentication required.';
  end if;

  if not private.can_access_company(p_company_id) then
    raise exception 'You do not have access to this company.';
  end if;

  if p_quantity_sold <= 0 then
    raise exception 'Quantity sold must be greater than zero.';
  end if;

  select *
  into target_item
  from public.inventory_items
  where id = p_inventory_item_id
    and company_id = p_company_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Inventory item not found.';
  end if;

  if p_quantity_sold > target_item.quantity then
    raise exception 'Quantity sold cannot exceed available inventory.';
  end if;

  if p_selling_price_per_unit < target_item.min_selling_price
    or p_selling_price_per_unit > target_item.max_selling_price then
    raise exception 'Selling price must be within the allowed min/max range.';
  end if;

  update public.inventory_items
  set quantity = quantity - p_quantity_sold,
      updated_by = actor_id,
      updated_at = timezone('utc', now())
  where id = target_item.id
  returning * into target_item;

  insert into public.sales (
    company_id,
    inventory_item_id,
    sold_by,
    quantity_sold,
    selling_price_per_unit,
    updated_by
  )
  values (
    p_company_id,
    p_inventory_item_id,
    actor_id,
    p_quantity_sold,
    p_selling_price_per_unit,
    actor_id
  )
  returning * into recorded_sale;

  select username
  into actor_name
  from public.profiles
  where id = actor_id;

  insert into public.notifications (
    company_id,
    title,
    message,
    created_by,
    updated_by
  )
  values (
    p_company_id,
    'Sale recorded',
    format(
      '%s sold %s units of %s at %s each.',
      coalesce(actor_name, 'A team member'),
      p_quantity_sold,
      target_item.title,
      to_char(p_selling_price_per_unit, 'FM$999999990.00')
    ),
    actor_id,
    actor_id
  );

  perform private.insert_activity_log(
    p_company_id,
    'sale',
    recorded_sale.id,
    'created',
    format(
      '%s sold %s units of %s.',
      coalesce(actor_name, 'A team member'),
      p_quantity_sold,
      target_item.title
    ),
    actor_id,
    jsonb_build_object(
      'inventory_item_id', p_inventory_item_id,
      'quantity_sold', p_quantity_sold,
      'selling_price_per_unit', p_selling_price_per_unit,
      'total_amount', recorded_sale.total_amount
    )
  );

  return recorded_sale;
end;
$$;

revoke all on function public.record_sale(uuid, uuid, integer, numeric) from public;
grant execute on function public.record_sale(uuid, uuid, integer, numeric) to authenticated;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.company_is_active(uuid) to authenticated;
grant execute on function private.can_access_company(uuid) to authenticated;
grant execute on function private.shares_company_with(uuid) to authenticated;
grant execute on function private.can_access_notification(uuid) to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function private.set_updated_at();

drop trigger if exists company_members_set_updated_at on public.company_members;
create trigger company_members_set_updated_at
before update on public.company_members
for each row
execute function private.set_updated_at();

drop trigger if exists inventory_items_set_updated_at on public.inventory_items;
create trigger inventory_items_set_updated_at
before update on public.inventory_items
for each row
execute function private.set_updated_at();

drop trigger if exists sales_set_updated_at on public.sales;
create trigger sales_set_updated_at
before update on public.sales
for each row
execute function private.set_updated_at();

drop trigger if exists notifications_set_updated_at on public.notifications;
create trigger notifications_set_updated_at
before update on public.notifications
for each row
execute function private.set_updated_at();

drop trigger if exists notification_reads_set_updated_at on public.notification_reads;
create trigger notification_reads_set_updated_at
before update on public.notification_reads
for each row
execute function private.set_updated_at();

drop trigger if exists companies_activity_log_trigger on public.companies;
create trigger companies_activity_log_trigger
after insert or update on public.companies
for each row
execute function private.capture_activity_log('company');

drop trigger if exists company_members_activity_log_trigger on public.company_members;
create trigger company_members_activity_log_trigger
after insert or update on public.company_members
for each row
execute function private.capture_activity_log('company_member');

drop trigger if exists inventory_items_activity_log_trigger on public.inventory_items;
create trigger inventory_items_activity_log_trigger
after insert or update on public.inventory_items
for each row
execute function private.capture_activity_log('inventory_item');

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.inventory_items enable row level security;
alter table public.sales enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists "profiles_select_visible_profiles" on public.profiles;
create policy "profiles_select_visible_profiles"
on public.profiles
for select
to authenticated
using (
  deleted_at is null
  and (
    id = (select auth.uid())
    or private.is_admin()
    or private.shares_company_with(id)
  )
);

drop policy if exists "profiles_admin_manage_profiles" on public.profiles;
create policy "profiles_admin_manage_profiles"
on public.profiles
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "companies_select_accessible" on public.companies;
create policy "companies_select_accessible"
on public.companies
for select
to authenticated
using (
  deleted_at is null
  and private.can_access_company(id)
);

drop policy if exists "companies_admin_insert" on public.companies;
create policy "companies_admin_insert"
on public.companies
for insert
to authenticated
with check (
  private.is_admin()
  and deleted_at is null
);

drop policy if exists "companies_admin_update" on public.companies;
create policy "companies_admin_update"
on public.companies
for update
to authenticated
using (
  deleted_at is null
  and private.is_admin()
)
with check (private.is_admin());

drop policy if exists "company_members_select_accessible" on public.company_members;
create policy "company_members_select_accessible"
on public.company_members
for select
to authenticated
using (
  deleted_at is null
  and private.can_access_company(company_id)
);

drop policy if exists "company_members_admin_insert" on public.company_members;
create policy "company_members_admin_insert"
on public.company_members
for insert
to authenticated
with check (
  private.is_admin()
  and private.company_is_active(company_id)
);

drop policy if exists "company_members_admin_update" on public.company_members;
create policy "company_members_admin_update"
on public.company_members
for update
to authenticated
using (
  deleted_at is null
  and private.is_admin()
)
with check (private.is_admin());

drop policy if exists "inventory_items_select_accessible" on public.inventory_items;
create policy "inventory_items_select_accessible"
on public.inventory_items
for select
to authenticated
using (
  deleted_at is null
  and private.can_access_company(company_id)
);

drop policy if exists "inventory_items_insert_accessible" on public.inventory_items;
create policy "inventory_items_insert_accessible"
on public.inventory_items
for insert
to authenticated
with check (
  private.can_access_company(company_id)
  and deleted_at is null
);

drop policy if exists "inventory_items_update_accessible" on public.inventory_items;
create policy "inventory_items_update_accessible"
on public.inventory_items
for update
to authenticated
using (
  deleted_at is null
  and private.can_access_company(company_id)
)
with check (private.can_access_company(company_id));

drop policy if exists "sales_select_accessible" on public.sales;
create policy "sales_select_accessible"
on public.sales
for select
to authenticated
using (
  deleted_at is null
  and private.can_access_company(company_id)
);

drop policy if exists "sales_admin_update" on public.sales;
create policy "sales_admin_update"
on public.sales
for update
to authenticated
using (
  deleted_at is null
  and private.is_admin()
)
with check (private.is_admin());

drop policy if exists "notifications_select_accessible" on public.notifications;
create policy "notifications_select_accessible"
on public.notifications
for select
to authenticated
using (
  deleted_at is null
  and private.can_access_company(company_id)
);

drop policy if exists "notifications_admin_update" on public.notifications;
create policy "notifications_admin_update"
on public.notifications
for update
to authenticated
using (
  deleted_at is null
  and private.is_admin()
)
with check (private.is_admin());

drop policy if exists "notification_reads_select_own" on public.notification_reads;
create policy "notification_reads_select_own"
on public.notification_reads
for select
to authenticated
using (
  user_id = (select auth.uid())
  or private.is_admin()
);

drop policy if exists "notification_reads_insert_own" on public.notification_reads;
create policy "notification_reads_insert_own"
on public.notification_reads
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and private.can_access_notification(notification_id)
);

drop policy if exists "notification_reads_update_own" on public.notification_reads;
create policy "notification_reads_update_own"
on public.notification_reads
for update
to authenticated
using (
  user_id = (select auth.uid())
  and private.can_access_notification(notification_id)
)
with check (
  user_id = (select auth.uid())
  and private.can_access_notification(notification_id)
);

drop policy if exists "activity_logs_select_accessible" on public.activity_logs;
create policy "activity_logs_select_accessible"
on public.activity_logs
for select
to authenticated
using (
  private.is_admin()
  or (
    company_id is not null
    and private.can_access_company(company_id)
  )
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
