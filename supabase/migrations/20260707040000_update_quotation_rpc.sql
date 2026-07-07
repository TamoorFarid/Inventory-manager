-- Mirrors the existing create_quotation RPC: atomically updates a quotation's
-- header fields and fully replaces its line items, so editing a quote behaves
-- the same way creating one does (including adding/removing line items).
create or replace function public.update_quotation(
  p_quotation_id uuid,
  p_customer_name text,
  p_customer_address text,
  p_quote_date date,
  p_subtotal numeric,
  p_total numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row  quotations%rowtype;
  v_item jsonb;
begin
  update quotations
  set customer_name    = p_customer_name,
      customer_address = p_customer_address,
      quote_date       = p_quote_date,
      subtotal         = p_subtotal,
      total            = p_total,
      updated_by       = auth.uid(),
      updated_at       = timezone('utc', now())
  where id = p_quotation_id
    and deleted_at is null;

  if not found then
    raise exception 'Quotation not found.';
  end if;

  delete from quotation_items where quotation_id = p_quotation_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into quotation_items (
      quotation_id, sl_no, description, quantity, unit_price, amount
    )
    values (
      p_quotation_id,
      (v_item->>'slNo')::integer,
      v_item->>'description',
      (v_item->>'quantity')::numeric,
      (v_item->>'unitPrice')::numeric,
      (v_item->>'amount')::numeric
    );
  end loop;

  select * into v_row from quotations where id = p_quotation_id;

  return to_jsonb(v_row);
end;
$function$;
