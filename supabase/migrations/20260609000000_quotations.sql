-- ============================================================================
-- Quotations: Company-scoped estimate/quotation records with line items
-- ============================================================================

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  est_id text not null,
  customer_name text not null,
  customer_address text not null,
  quote_date date not null default current_date,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  deleted_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  sl_no integer not null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists quotations_company_id_idx
  on public.quotations(company_id) where deleted_at is null;

create index if not exists quotation_items_quotation_id_idx
  on public.quotation_items(quotation_id);

-- RLS
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;

-- Drop existing policies so this file is safe to re-run
drop policy if exists "quotations_select_company_members" on public.quotations;
drop policy if exists "quotations_insert_company_members" on public.quotations;
drop policy if exists "quotations_update_company_members" on public.quotations;
drop policy if exists "quotation_items_select" on public.quotation_items;
drop policy if exists "quotation_items_insert" on public.quotation_items;
drop policy if exists "quotation_items_delete" on public.quotation_items;

-- Quotations: Company members only
create policy "quotations_select_company_members"
  on public.quotations for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.company_members
      where company_members.company_id = quotations.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  );

create policy "quotations_insert_company_members"
  on public.quotations for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.company_members
      where company_members.company_id = quotations.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  );

create policy "quotations_update_company_members"
  on public.quotations for update to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.company_members
      where company_members.company_id = quotations.company_id
        and company_members.user_id = auth.uid()
        and company_members.deleted_at is null
    )
  )
  with check (updated_by = auth.uid());

-- Quotation items: follow parent quotation membership
create policy "quotation_items_select"
  on public.quotation_items for select to authenticated
  using (
    exists (
      select 1 from public.quotations q
      join public.company_members cm on cm.company_id = q.company_id
      where q.id = quotation_items.quotation_id
        and q.deleted_at is null
        and cm.user_id = auth.uid()
        and cm.deleted_at is null
    )
  );

create policy "quotation_items_insert"
  on public.quotation_items for insert to authenticated
  with check (
    exists (
      select 1 from public.quotations q
      join public.company_members cm on cm.company_id = q.company_id
      where q.id = quotation_items.quotation_id
        and q.deleted_at is null
        and cm.user_id = auth.uid()
        and cm.deleted_at is null
    )
  );

create policy "quotation_items_delete"
  on public.quotation_items for delete to authenticated
  using (
    exists (
      select 1 from public.quotations q
      join public.company_members cm on cm.company_id = q.company_id
      where q.id = quotation_items.quotation_id
        and q.deleted_at is null
        and cm.user_id = auth.uid()
        and cm.deleted_at is null
    )
  );
