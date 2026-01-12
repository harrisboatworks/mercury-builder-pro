-- Add promo_options column for Choose One structure
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS promo_options JSONB DEFAULT NULL;

-- Update the Mercury Get 7 promotion with the new Choose One structure
UPDATE public.promotions 
SET 
  name = 'Mercury Get 7 + Choose One',
  bonus_title = 'Get 7 Years + Choose One Bonus!',
  bonus_description = '7 years factory coverage PLUS your choice: 6 months no payments, special financing rates, OR a factory rebate up to $1,000',
  bonus_short_badge = '7 Years + Choose One',
  start_date = '2026-01-12T00:00:00.000Z',
  end_date = '2026-03-31T23:59:59.000Z',
  warranty_extra_years = 4,
  promo_options = '{
    "type": "choose_one",
    "options": [
      {
        "id": "no_payments",
        "title": "6 Months No Payments",
        "description": "Defer your first payment for 6 months. Get your motor now, pay later.",
        "icon": "calendar-off"
      },
      {
        "id": "special_financing",
        "title": "Special Financing Rates",
        "description": "Low promotional rates on qualifying purchases ($5,000 minimum)",
        "icon": "percent",
        "rates": [
          { "months": 24, "rate": 2.99 },
          { "months": 36, "rate": 3.99 },
          { "months": 48, "rate": 4.49 },
          { "months": 60, "rate": 5.49 }
        ],
        "minimum_amount": 5000
      },
      {
        "id": "cash_rebate",
        "title": "Factory Rebate",
        "description": "Get up to $1,000 cash back based on your motor horsepower",
        "icon": "banknote",
        "matrix": [
          { "hp_min": 2.5, "hp_max": 6, "rebate": 100 },
          { "hp_min": 8, "hp_max": 20, "rebate": 250 },
          { "hp_min": 25, "hp_max": 25, "rebate": 300 },
          { "hp_min": 30, "hp_max": 60, "rebate": 350 },
          { "hp_min": 65, "hp_max": 75, "rebate": 400 },
          { "hp_min": 80, "hp_max": 115, "rebate": 500 },
          { "hp_min": 150, "hp_max": 200, "rebate": 650 },
          { "hp_min": 225, "hp_max": 425, "rebate": 1000 }
        ]
      }
    ]
  }'::jsonb
WHERE id = '120925ab-9074-43bf-948f-cf91bcbe2d10';