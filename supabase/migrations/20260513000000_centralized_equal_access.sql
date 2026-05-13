-- Migration: Hybrid access model - Centralized inventory, Company-scoped sales
-- Companies and inventory are accessible to all users
-- Sales, notifications, and activity logs are private to company members

-- Drop ALL existing RLS policies (old and new names)
drop policy if exists "profiles_select_policy" on public.profiles;
drop policy if exists "profiles_insert_policy" on public.profiles;
drop policy if exists "profiles_update_policy" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_insert_authenticated" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

drop policy if exists "companies_select_policy" on public.companies;
drop policy if exists "companies_insert_policy" on public.companies;
drop policy if exists "companies_update_policy" on public.companies;
drop policy if exists "companies_select_all" on public.companies;
drop policy if exists "companies_insert_all" on public.companies;
drop policy if exists "companies_update_all" on public.companies;

drop policy if exists "company_members_select_policy" on public.company_members;
drop policy if exists "company_members_insert_policy" on public.company_members;
drop policy if exists "company_members_update_policy" on public.company_members;
drop policy if exists "company_members_select_all" on public.company_members;
drop policy if exists "company_members_insert_all" on public.company_members;
drop policy if exists "company_members_update_all" on public.company_members;

drop policy if exists "inventory_items_select_policy" on public.inventory_items;
drop policy if exists "inventory_items_insert_policy" on public.inventory_items;
drop policy if exists "inventory_items_update_policy" on public.inventory_items;
drop policy if exists "inventory_items_select_all" on public.inventory_items;
drop policy if exists "inventory_items_insert_all" on public.inventory_items;
drop policy if exists "inventory_items_update_all" on public.inventory_items;

drop policy if exists "sales_select_policy" on public.sales;
drop policy if exists "sales_update_policy" on public.sales;
drop policy if exists "sales_select_company_members" on public.sales;
drop policy if exists "sales_update_company_members" on public.sales;

drop policy if exists "notifications_select_policy" on public.notifications;
drop policy if exists "notifications_update_policy" on public.notifications;
drop policy if exists "notifications_select_company_members" on public.notifications;
drop policy if exists "notifications_update_company_members" on public.notifications;

drop policy if exists "notification_reads_select_policy" on public.notification_reads;
drop policy if exists "notification_reads_insert_policy" on public.notification_reads;
drop policy if exists "notification_reads_update_policy" on public.notification_reads;
drop policy if exists "notification_reads_select_own" on public.notification_reads;
drop policy if exists "notification_reads_insert_own" on public.notification_reads;
drop policy if exists "notification_reads_update_own" on public.notification_reads;

drop policy if exists "activity_logs_select_policy" on public.activity_logs;
drop policy if exists "activity_logs_select_company_members" on public.activity_logs;

-- ============================================================================
-- CENTRALIZED ACCESS POLICIES (All Authenticated Users)
-- ============================================================================

-- Profiles: All authenticated users can view all profiles, update own profile
alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles
  for select
  to authenticated
  using (deleted_at is null);

create policy "profiles_insert_authenticated"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() and deleted_at is null)
  with check (id = auth.uid());

-- Companies: All authenticated users can view, create, and update all companies
alter table public.companies enable row level security;

create policy "companies_select_all"
  on public.companies
  for select
  to authenticated
  using (deleted_at is null);

create policy "companies_insert_all"
  on public.companies
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "companies_update_all"
  on public.companies
  for update
  to authenticated
  using (deleted_at is null)
  with check (deleted_at is null or updated_by = auth.uid());

-- Company Members: All authenticated users can manage all memberships
alter table public.company_members enable row level security;

create policy "company_members_select_all"
  on public.company_members
  for select
  to authenticated
  using (deleted_at is null);

create policy "company_members_insert_all"
  on public.company_members
  for insert
  to authenticated
  with check (added_by = auth.uid());

create policy "company_members_update_all"
  on public.company_members
  for update
  to authenticated
  using (deleted_at is null)
  with check (deleted_at is null or removed_by = auth.uid() or deleted_by = auth.uid());

-- Inventory Items: All authenticated users can manage all inventory
alter table public.inventory_items enable row level security;

create policy "inventory_items_select_all"
  on public.inventory_items
  for select
  to authenticated
  using (deleted_at is null);

create policy "inventory_items_insert_all"
  on public.inventory_items
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "inventory_items_update_all"
  on public.inventory_items
  for update
  to authenticated
  using (deleted_at is null)
  with check (deleted_at is null or updated_by = auth.uid() or deleted_by = auth.uid());

-- ============================================================================
-- COMPANY-SCOPED ACCESS POLICIES (Members Only)
-- ============================================================================

-- Sales: Users can only view sales for companies they are members of
alter table public.sales enable row level security;

create policy "sales_select_company_members"
  on public.sales
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.company_members
      where company_members.company_id = sales.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  );

create policy "sales_update_company_members"
  on public.sales
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.company_members
      where company_members.company_id = sales.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  )
  with check (updated_by = auth.uid());

-- Notifications: Users can only view notifications for companies they are members of
alter table public.notifications enable row level security;

create policy "notifications_select_company_members"
  on public.notifications
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.company_members
      where company_members.company_id = notifications.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  );

create policy "notifications_update_company_members"
  on public.notifications
  for update
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.company_members
      where company_members.company_id = notifications.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  )
  with check (updated_by = auth.uid());

-- Notification Reads: Users can manage their own reads
alter table public.notification_reads enable row level security;

create policy "notification_reads_select_own"
  on public.notification_reads
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "notification_reads_insert_own"
  on public.notification_reads
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "notification_reads_update_own"
  on public.notification_reads
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Activity Logs: Users can view activity for companies they are members of
alter table public.activity_logs enable row level security;

create policy "activity_logs_select_company_members"
  on public.activity_logs
  for select
  to authenticated
  using (
    company_id is null
    or exists (
      select 1
      from public.company_members
      where company_members.company_id = activity_logs.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- can_access_company: Checks if user is a member of the company (for sales)
create or replace function private.can_access_company(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select private.company_is_active(target_company_id)
    and exists (
      select 1
      from public.company_members
      where company_id = target_company_id
        and user_id = auth.uid()
        and deleted_at is null
    );
$$;

-- shares_company_with: Checks if users share company membership
create or replace function private.shares_company_with(target_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select target_user_id = auth.uid()
    or exists (
      select 1
      from public.company_members source_membership
      join public.company_members target_membership
        on target_membership.company_id = source_membership.company_id
      join public.companies companies
        on companies.id = source_membership.company_id
      where source_membership.user_id = auth.uid()
        and target_membership.user_id = target_user_id
        and source_membership.deleted_at is null
        and target_membership.deleted_at is null
        and companies.deleted_at is null
    );
$$;

-- can_access_notification: Checks company membership for notifications
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
      and exists (
        select 1
        from public.company_members
        where company_members.company_id = notifications.company_id
          and company_members.user_id = auth.uid()
          and company_members.deleted_at is null
      )
  );
$$;

-- record_sale: Records a sale with company membership validation
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

  -- Check if user is a member of the company (required for sales)
  if not exists (
    select 1
    from public.company_members
    where company_id = p_company_id
      and user_id = actor_id
      and deleted_at is null
  ) then
    raise exception 'You must be a member of this company to record sales.';
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
    'New sale recorded',
    format('%s sold %s units of "%s" at %s per unit.',
      coalesce(actor_name, 'A user'),
      p_quantity_sold,
      target_item.title,
      p_selling_price_per_unit::text
    ),
    actor_id,
    actor_id
  );

  return recorded_sale;
end;
$$;
