alter table public.sales
  add column if not exists customer_name text;

create or replace function public.record_sale(
  p_company_id uuid,
  p_inventory_item_id uuid,
  p_quantity_sold integer,
  p_selling_price_per_unit numeric,
  p_customer_name text default null
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
    customer_name,
    updated_by
  )
  values (
    p_company_id,
    p_inventory_item_id,
    actor_id,
    p_quantity_sold,
    p_selling_price_per_unit,
    nullif(trim(p_customer_name), ''),
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

revoke all on function public.record_sale(uuid, uuid, integer, numeric, text) from public;
grant execute on function public.record_sale(uuid, uuid, integer, numeric, text) to authenticated;
