-- Fix existing brochure motor MSRP values from 40% markup to 10% markup
-- This addresses the pricing discrepancy where HTML imports had incorrect markup calculation

-- Log the motors that will be updated (for verification)
DO $$
DECLARE
  motors_to_update INTEGER;
  motors_updated INTEGER;
BEGIN
  -- Count motors that will be updated
  SELECT COUNT(*) INTO motors_to_update
  FROM motor_models 
  WHERE is_brochure = true 
    AND dealer_price > 0 
    AND msrp > 0
    AND msrp > dealer_price * 1.3; -- Safety check: only update motors with >30% markup
  
  RAISE NOTICE 'About to update % brochure motors with excessive MSRP markup', motors_to_update;
  
  -- Perform the bulk update
  UPDATE motor_models 
  SET 
    msrp = ROUND(dealer_price * 1.1), -- Apply correct 10% markup
    updated_at = now(),
    msrp_calc_source = 'bulk_correction_10_percent' -- Track this correction
  WHERE is_brochure = true 
    AND dealer_price > 0 
    AND msrp > 0
    AND msrp > dealer_price * 1.3; -- Safety check: only update motors with >30% markup
  
  GET DIAGNOSTICS motors_updated = ROW_COUNT;
  
  RAISE NOTICE 'Successfully updated % brochure motors with corrected 10%% MSRP markup', motors_updated;
  
  -- Insert audit log entry
  INSERT INTO motor_enrichment_log (
    motor_id,
    source_name,
    action,
    success,
    data_added,
    created_at
  )
  SELECT 
    id,
    'bulk_msrp_correction',
    'msrp_markup_fixed',
    true,
    jsonb_build_object(
      'old_markup_ratio', ROUND((msrp / dealer_price)::numeric, 2),
      'new_markup_ratio', 1.1,
      'correction_reason', 'html_import_markup_error'
    ),
    now()
  FROM motor_models 
  WHERE is_brochure = true 
    AND dealer_price > 0 
    AND msrp = ROUND(dealer_price * 1.1) -- Motors that were just updated
    AND msrp_calc_source = 'bulk_correction_10_percent';
    
END $$;