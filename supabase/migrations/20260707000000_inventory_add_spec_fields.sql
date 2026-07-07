alter table public.inventory_items
  add column if not exists kw_pv text,
  add column if not exists ip_rating text,
  add column if not exists warranty text;
