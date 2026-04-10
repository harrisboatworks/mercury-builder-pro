
INSERT INTO public.promotions (
  name,
  kind,
  is_active,
  highlight,
  stackable,
  priority,
  discount_percentage,
  discount_fixed_amount,
  warranty_extra_years,
  start_date,
  end_date,
  bonus_title,
  bonus_description,
  bonus_short_badge,
  details
) VALUES (
  '7-Year Factory-Backed Warranty',
  'warranty',
  true,
  true,
  false,
  1,
  0,
  0,
  4,
  '2025-04-10',
  '2025-12-31',
  'Get 7 Years of Zero-Worry Boating',
  'Buy any new Mercury outboard from Harris Boat Works and get 7 full years of factory-backed warranty coverage. No third-party insurance — straight Mercury protection from a Platinum Dealer since 1965.',
  '7-Year Warranty',
  '{"type": "warranty_extension", "source": "dealer", "covers": "all_new_mercury", "base_years": 3, "bonus_years": 4, "total_years": 7, "includes_rebate": false, "tagline": "Turn the key. It starts. Every time."}'::jsonb
);
