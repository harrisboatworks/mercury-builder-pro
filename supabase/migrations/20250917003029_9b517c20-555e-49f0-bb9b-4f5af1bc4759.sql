-- Populate model_display field with properly formatted motor names
-- This fixes the spacing issue where "8MH FourStroke" should display as "8 MH FourStroke"

-- Add the formatting function to fix HP spacing
CREATE OR REPLACE FUNCTION format_motor_display_name(model_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF model_name IS NULL OR trim(model_name) = '' THEN
    RETURN '';
  END IF;
  
  -- Add space after HP numbers followed by rigging codes
  -- Matches patterns like: 8MH, 9.9ELH, 25ELHPT, 40EXLPT, etc.
  RETURN regexp_replace(
    trim(model_name),
    '(\d+(?:\.\d+)?)(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\M',
    '\1 \2',
    'g'
  );
END;
$$;

-- Update all motors where model_display is null or doesn't have proper spacing
DO $$
DECLARE
  motors_updated INTEGER;
  sample_motors RECORD;
BEGIN
  -- Show some examples before updating
  RAISE NOTICE 'Sample motors that will be updated:';
  
  FOR sample_motors IN 
    SELECT id, model, model_display, format_motor_display_name(model) as new_display
    FROM motor_models 
    WHERE (model_display IS NULL OR model_display != format_motor_display_name(model))
      AND model IS NOT NULL
    LIMIT 5
  LOOP
    RAISE NOTICE '  Motor ID: % | Current model: "%" | Current display: "%" | New display: "%"',
      sample_motors.id, 
      sample_motors.model, 
      COALESCE(sample_motors.model_display, 'NULL'),
      sample_motors.new_display;
  END LOOP;

  -- Perform the bulk update
  UPDATE motor_models 
  SET 
    model_display = format_motor_display_name(model),
    updated_at = now()
  WHERE (model_display IS NULL OR model_display != format_motor_display_name(model))
    AND model IS NOT NULL;
  
  GET DIAGNOSTICS motors_updated = ROW_COUNT;
  
  RAISE NOTICE 'Successfully updated % motors with properly formatted model_display names', motors_updated;
  
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
    'display_name_formatter',
    'model_display_spacing_fixed',
    true,
    jsonb_build_object(
      'old_display', CASE WHEN model_display IS NULL THEN 'NULL' ELSE model_display END,
      'new_display', model_display,
      'formatted_from_model', model
    ),
    now()
  FROM motor_models 
  WHERE model_display = format_motor_display_name(model)
    AND updated_at >= now() - interval '1 minute'; -- Just updated records
    
END $$;