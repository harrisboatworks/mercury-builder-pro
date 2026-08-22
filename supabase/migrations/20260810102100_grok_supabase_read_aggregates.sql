-- Aggregate-only RPCs for the authenticated Grok MCP connector.
-- No row-level identifiers, people, free text notes, prices, costs, or margins.
-- Functions run with caller privileges and are executable only by service_role.

create or replace function public.grok_inventory_summary()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
with
unit_base as (
  select
    coalesce(nullif(btrim(unit_status), ''), 'Unknown') as status_label,
    coalesce(nullif(btrim(unit_type), ''), 'Unknown') as type_label,
    coalesce(nullif(btrim(make), ''), 'Unknown') as make_label,
    coalesce(nullif(btrim(new_used), ''), 'Unknown') as condition_label,
    case
      when date_received is null then 'unknown'
      when date_received::date >= current_date - 90 then '0-90 days'
      when date_received::date >= current_date - 180 then '91-180 days'
      when date_received::date >= current_date - 365 then '181-365 days'
      else '366+ days'
    end as age_bucket,
    synced_at
  from public.unit_inventory
),
unit_status as (
  select status_label as label, count(*)::integer as units
  from unit_base group by status_label
),
unit_types as (
  select type_label as label, count(*)::integer as units
  from unit_base group by type_label
),
unit_makes as (
  select make_label as label, count(*)::integer as units
  from unit_base group by make_label
  order by units desc, label
  limit 20
),
unit_conditions as (
  select condition_label as label, count(*)::integer as units
  from unit_base group by condition_label
),
unit_age as (
  select age_bucket as label, count(*)::integer as units
  from unit_base group by age_bucket
),
motor_base as (
  select
    case
      when hp is null then 'unknown'
      when hp < 25 then 'under 25 HP'
      when hp < 75 then '25-74 HP'
      when hp < 150 then '75-149 HP'
      when hp < 250 then '150-249 HP'
      else '250+ HP'
    end as hp_band,
    coalesce(nullif(btrim(availability_status), ''), nullif(btrim(unit_status), ''), 'Unknown') as availability_label,
    coalesce(available_for_sale, false) as available_for_sale,
    synced_at
  from public.mercury_motor_inventory
),
motor_hp as (
  select hp_band as label, count(*)::integer as motors
  from motor_base group by hp_band
),
motor_availability as (
  select availability_label as label, count(*)::integer as motors
  from motor_base group by availability_label
)
select jsonb_build_object(
  'generated_at', now(),
  'source_synced_at', jsonb_build_object(
    'units', (select max(synced_at) from unit_base),
    'motors', (select max(synced_at) from motor_base)
  ),
  'units', jsonb_build_object(
    'total', (select count(*)::integer from unit_base),
    'by_status', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by units desc, label)
      from unit_status
    ), '[]'::jsonb),
    'by_type', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by units desc, label)
      from unit_types
    ), '[]'::jsonb),
    'by_make', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by units desc, label)
      from unit_makes
    ), '[]'::jsonb),
    'by_new_used', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by units desc, label)
      from unit_conditions
    ), '[]'::jsonb),
    'by_age', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by
        case label when '0-90 days' then 1 when '91-180 days' then 2 when '181-365 days' then 3 when '366+ days' then 4 else 5 end)
      from unit_age
    ), '[]'::jsonb)
  ),
  'mercury_motors', jsonb_build_object(
    'total', (select count(*)::integer from motor_base),
    'available_for_sale', (select count(*)::integer from motor_base where available_for_sale),
    'by_hp_band', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'motors', motors) order by
        case label when 'under 25 HP' then 1 when '25-74 HP' then 2 when '75-149 HP' then 3 when '150-249 HP' then 4 when '250+ HP' then 5 else 6 end)
      from motor_hp
    ), '[]'::jsonb),
    'by_availability', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'motors', motors) order by motors desc, label)
      from motor_availability
    ), '[]'::jsonb)
  )
);
$function$;

create or replace function public.grok_service_backlog_summary()
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
with
base as (
  select
    coalesce(
      nullif(btrim(status), ''),
      case when ro_status is not null then format('Status code %s', ro_status) end,
      'Unknown'
    ) as status_label,
    coalesce(nullif(btrim(category), ''), 'Uncategorized') as category_label,
    case
      when date_in is null then null
      else greatest(current_date - date_in::date, 0)
    end as age_days,
    promised_date,
    synced_at
  from public.open_service_board
),
status_counts as (
  select status_label as label, count(*)::integer as open_orders
  from base group by status_label
),
category_counts as (
  select category_label as label, count(*)::integer as open_orders
  from base group by category_label
  order by open_orders desc, label
  limit 20
),
age_counts as (
  select
    case
      when age_days is null then 'unknown'
      when age_days <= 7 then '0-7 days'
      when age_days <= 14 then '8-14 days'
      when age_days <= 30 then '15-30 days'
      when age_days <= 60 then '31-60 days'
      else '61+ days'
    end as label,
    count(*)::integer as open_orders
  from base
  group by 1
)
select jsonb_build_object(
  'generated_at', now(),
  'source_synced_at', (select max(synced_at) from base),
  'total_open', (select count(*)::integer from base),
  'promised_overdue', (select count(*)::integer from base where promised_date::date < current_date),
  'oldest_age_days', (select max(age_days) from base),
  'by_status', coalesce((
    select jsonb_agg(jsonb_build_object('label', label, 'open_orders', open_orders) order by open_orders desc, label)
    from status_counts
  ), '[]'::jsonb),
  'by_category', coalesce((
    select jsonb_agg(jsonb_build_object('label', label, 'open_orders', open_orders) order by open_orders desc, label)
    from category_counts
  ), '[]'::jsonb),
  'by_age', coalesce((
    select jsonb_agg(jsonb_build_object('label', label, 'open_orders', open_orders) order by
      case label when '0-7 days' then 1 when '8-14 days' then 2 when '15-30 days' then 3 when '31-60 days' then 4 when '61+ days' then 5 else 6 end)
    from age_counts
  ), '[]'::jsonb)
);
$function$;

create or replace function public.grok_sales_trends(p_months integer default 12)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
with
settings as (
  select greatest(1, least(coalesce(p_months, 12), 24))::integer as months
),
base as (
  select
    coalesce(delivery_date::date, contract_date::date) as activity_date,
    coalesce(nullif(btrim(new_used), ''), 'Unknown') as condition_label,
    coalesce(nullif(btrim(make), ''), 'Unknown') as make_label,
    coalesce(nullif(btrim(unit_type), ''), 'Unknown') as type_label,
    synced_at
  from public.deals_units, settings
  where coalesce(delivery_date::date, contract_date::date)
    >= (date_trunc('month', current_date)::date - make_interval(months => settings.months - 1))::date
),
monthly as (
  select
    to_char(date_trunc('month', activity_date), 'YYYY-MM') as period,
    count(*)::integer as units,
    count(*) filter (where lower(condition_label) in ('n', 'new'))::integer as new_units,
    count(*) filter (where lower(condition_label) in ('u', 'used'))::integer as used_units
  from base
  group by 1
),
makes as (
  select make_label as label, count(*)::integer as units
  from base group by make_label
  order by units desc, label
  limit 20
),
types as (
  select type_label as label, count(*)::integer as units
  from base group by type_label
  order by units desc, label
  limit 20
)
select jsonb_build_object(
  'generated_at', now(),
  'lookback_months', (select months from settings),
  'source_synced_at', (select max(synced_at) from base),
  'total_units', (select count(*)::integer from base),
  'monthly', coalesce((
    select jsonb_agg(jsonb_build_object(
      'period', period,
      'units', units,
      'new_units', new_units,
      'used_units', used_units
    ) order by period)
    from monthly
  ), '[]'::jsonb),
  'by_make', coalesce((
    select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by units desc, label)
    from makes
  ), '[]'::jsonb),
  'by_type', coalesce((
    select jsonb_agg(jsonb_build_object('label', label, 'units', units) order by units desc, label)
    from types
  ), '[]'::jsonb)
);
$function$;

create or replace function public.grok_parts_demand_trends(p_months integer default 6)
returns jsonb
language sql
stable
security invoker
set search_path = pg_catalog, public
as $function$
with
settings as (
  select greatest(1, least(coalesce(p_months, 6), 12))::integer as months
),
base as (
  select
    invoice_date::date as activity_date,
    coalesce(nullif(btrim(category), ''), 'Uncategorized') as category_label,
    coalesce(qty, 0)::numeric as quantity,
    invoice_no,
    synced_at
  from public.parts_invoices, settings
  where invoice_date::date
    >= (date_trunc('month', current_date)::date - make_interval(months => settings.months - 1))::date
),
monthly as (
  select
    to_char(date_trunc('month', activity_date), 'YYYY-MM') as period,
    coalesce(sum(quantity), 0) as net_units,
    coalesce(sum(abs(quantity)), 0) as gross_units,
    coalesce(sum(abs(quantity)) filter (where quantity < 0), 0) as returned_units,
    count(distinct invoice_no)::integer as invoices
  from base
  group by 1
),
categories as (
  select
    category_label as label,
    coalesce(sum(quantity), 0) as net_units,
    coalesce(sum(abs(quantity)), 0) as gross_units,
    count(distinct invoice_no)::integer as invoices
  from base
  group by category_label
  order by gross_units desc, label
  limit 20
)
select jsonb_build_object(
  'generated_at', now(),
  'lookback_months', (select months from settings),
  'source_synced_at', (select max(synced_at) from base),
  'monthly', coalesce((
    select jsonb_agg(jsonb_build_object(
      'period', period,
      'net_units', net_units,
      'gross_units', gross_units,
      'returned_units', returned_units,
      'invoices', invoices
    ) order by period)
    from monthly
  ), '[]'::jsonb),
  'by_category', coalesce((
    select jsonb_agg(jsonb_build_object(
      'label', label,
      'net_units', net_units,
      'gross_units', gross_units,
      'invoices', invoices
    ) order by gross_units desc, label)
    from categories
  ), '[]'::jsonb)
);
$function$;

revoke all on function public.grok_inventory_summary() from public, anon, authenticated;
revoke all on function public.grok_service_backlog_summary() from public, anon, authenticated;
revoke all on function public.grok_sales_trends(integer) from public, anon, authenticated;
revoke all on function public.grok_parts_demand_trends(integer) from public, anon, authenticated;

grant execute on function public.grok_inventory_summary() to service_role;
grant execute on function public.grok_service_backlog_summary() to service_role;
grant execute on function public.grok_sales_trends(integer) to service_role;
grant execute on function public.grok_parts_demand_trends(integer) to service_role;

comment on function public.grok_inventory_summary() is
  'Aggregate-only HBW inventory signal for the authenticated Grok connector; no row-level identifiers or money fields.';
comment on function public.grok_service_backlog_summary() is
  'Aggregate-only HBW open-service signal for the authenticated Grok connector; no customer, unit, staff, RO, or note fields.';
comment on function public.grok_sales_trends(integer) is
  'Aggregate-only HBW unit-sales counts for the authenticated Grok connector; no customer, deal, money, or unit identifier fields.';
comment on function public.grok_parts_demand_trends(integer) is
  'Aggregate-only HBW parts-demand counts for the authenticated Grok connector; no customer, invoice, part identifier, description, or money fields.';
