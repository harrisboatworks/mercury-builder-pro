-- Make the live promotion row self-describing so every AI and customer surface
-- can consume the same facts without hardcoded prompt copy.
UPDATE public.promotions
SET
  promo_options = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(promo_options, '{}'::jsonb),
        '{type}',
        '"layered"'::jsonb,
        true
      ),
      '{combination_mode}',
      '"layered"'::jsonb,
      true
    ),
    '{customer_choice_required}',
    'false'::jsonb,
    true
  ),
  details = COALESCE(details, '{}'::jsonb) || jsonb_build_object(
    'market', jsonb_build_object('country', 'CA', 'currency', 'CAD'),
    'combination_mode', 'layered',
    'customer_choice_required', false,
    'eligibility', jsonb_build_object(
      'products', jsonb_build_array(
        'New 2.5 HP to 425 HP Mercury FourStroke repower engines purchased directly from Mercury Marine Canada'
      ),
      'use', 'Recreational-pleasure use',
      'stock_requirement', 'Available new stock in dealer inventory',
      'delivery_required', true,
      'backorders_qualify', false,
      'exclusions', jsonb_build_array(
        'Boat and engine packages',
        'Engines purchased from an OEM boat builder',
        'Engines not purchased and invoiced directly from Mercury Marine Canada',
        'Commercial, camp, resort, guide, or outfitter use',
        'Government sales and donations',
        'Mercury Racing',
        'MerCruiser',
        'CPO',
        'SportJet',
        'OptiMax',
        'Mercury V12 engines',
        'All two-stroke engines',
        'Avator',
        'Backorders'
      )
    ),
    'requirements', jsonb_build_array(
      'Eligible retail sale must be completed and the engine delivered between July 15 and August 31, 2026',
      'Warranty registration must be entered through MercNET by September 15, 2026',
      'Harris Boat Works must issue the full qualifying rebate to the consumer'
    ),
    'registration_deadline', '2026-09-15',
    'consumer_rebate_method', 'Dealer-issued credit at purchase; Mercury does not mail a consumer cheque',
    'financing_qualification', 'As low as 2.99% APR for 24 months on approved credit, subject to terms and conditions',
    'legal', 'Offer void where restricted or otherwise prohibited by law',
    'source_documents', jsonb_build_array(
      'PY2027CanadaRepowerRiggingPromotion-Q3-2026.pdf',
      '26_587850_MM_RET_Q3_POP_8.5x11in_CA EN.pdf'
    )
  )
WHERE name = 'Mercury Summer Savings Rebate'
  AND start_date = DATE '2026-07-15'
  AND end_date = DATE '2026-08-31';
