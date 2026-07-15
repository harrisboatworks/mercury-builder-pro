-- HP rebate matrices are the sole price-discount source for their promotion.
-- Repair any pre-existing drift before enforcing the invariant.
update public.promotions
set
  discount_fixed_amount = 0,
  discount_percentage = 0
where jsonb_path_exists(
  coalesce(promo_options, '{}'::jsonb),
  '$.options[*] ? (@.id == "cash_rebate" && @.matrix.size() > 0)'
);

-- PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS, so make this safe for
-- repeated local/recovery runs with an explicit catalog check.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'promotions_matrix_has_no_universal_discount'
      and conrelid = 'public.promotions'::regclass
  ) then
    alter table public.promotions
      add constraint promotions_matrix_has_no_universal_discount
      check (
        not jsonb_path_exists(
          coalesce(promo_options, '{}'::jsonb),
          '$.options[*] ? (@.id == "cash_rebate" && @.matrix.size() > 0)'
        )
        or (
          coalesce(discount_fixed_amount, 0) = 0
          and coalesce(discount_percentage, 0) = 0
        )
      );
  end if;
end
$$;
