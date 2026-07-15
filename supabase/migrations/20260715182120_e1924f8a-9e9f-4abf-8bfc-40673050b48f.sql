
INSERT INTO public.promotions (
  name, is_active, start_date, end_date, priority, highlight, stackable,
  bonus_title, bonus_short_badge, bonus_description,
  discount_percentage, discount_fixed_amount, warranty_extra_years,
  image_url, image_alt_text, kind, promo_options
) VALUES (
  'Mercury Summer Savings Rebate',
  true,
  '2026-07-15',
  '2026-08-31',
  10,
  true,
  true,
  'Summer Savings Rebate: Save Up to $700 CAD + Financing as Low as 2.99% for 24 Months',
  'Save up to $700',
  'Save up to $700 CAD on eligible new Mercury FourStroke repower outboards (2.5 to 425 HP), plus promotional financing as low as 2.99% for 24 months on approved credit. Rebate applied by the dealer as a credit. Available July 15 to August 31, 2026.',
  0,
  700,
  0,
  '/lovable-uploads/mercury-summer-savings-rebate-2026-banner-1920x675.jpg',
  'Mercury Summer Savings Rebate: save up to $700 CAD plus financing as low as 2.99%, ends August 31, 2026',
  'rebate',
  jsonb_build_object(
    'type', 'choose_one',
    'options', jsonb_build_array(
      jsonb_build_object(
        'id', 'cash_rebate',
        'title', 'Factory Rebate up to $700 CAD',
        'description', 'Rigging rebate applied by the dealer as a credit at time of purchase. Amount depends on horsepower.',
        'icon', 'gift',
        'matrix', jsonb_build_array(
          jsonb_build_object('hp_min', 2.5, 'hp_max', 3.5,  'rebate', 50),
          jsonb_build_object('hp_min', 4,   'hp_max', 8,    'rebate', 75),
          jsonb_build_object('hp_min', 9.9, 'hp_max', 25,   'rebate', 100),
          jsonb_build_object('hp_min', 30,  'hp_max', 115,  'rebate', 250),
          jsonb_build_object('hp_min', 150, 'hp_max', 200,  'rebate', 350),
          jsonb_build_object('hp_min', 225, 'hp_max', 425,  'rebate', 700)
        )
      ),
      jsonb_build_object(
        'id', 'special_financing',
        'title', 'Promo Financing as Low as 2.99% for 24 Months',
        'description', 'Limited-time promotional rate on approved credit, subject to terms and conditions. Layered on top of the standard TD Always On program.',
        'icon', 'percent',
        'rates', jsonb_build_array(
          jsonb_build_object('months', 24, 'rate', 2.99)
        )
      )
    )
  )
)
ON CONFLICT DO NOTHING;
