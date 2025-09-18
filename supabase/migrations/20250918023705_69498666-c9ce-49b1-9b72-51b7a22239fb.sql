-- Clean up motor duplicates by keeping only the best record for each model_display
-- This will fix the issue where multiple import runs created duplicates with auto-generated model numbers

CREATE OR REPLACE FUNCTION public.cleanup_motor_duplicates_by_display()
RETURNS TABLE(
  total_duplicates_removed integer,
  cleanup_details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  duplicate_group RECORD;
  records_to_delete uuid[];
  total_removed integer := 0;
  cleanup_log jsonb := '[]'::jsonb;
BEGIN
  -- Find groups of motors with the same model_display that have more than 1 record
  FOR duplicate_group IN
    SELECT 
      model_display,
      COUNT(*) as duplicate_count,
      ARRAY_AGG(id ORDER BY 
        CASE WHEN is_brochure THEN 1 ELSE 2 END, -- Prefer brochure records
        CASE WHEN in_stock THEN 1 ELSE 2 END,    -- Then in-stock records
        CASE WHEN dealer_price IS NOT NULL THEN 1 ELSE 2 END, -- Then records with pricing
        created_at DESC -- Finally newest records
      ) as motor_ids
    FROM motor_models 
    WHERE model_display IS NOT NULL 
      AND trim(model_display) != ''
    GROUP BY model_display
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first record (best quality) and mark the rest for deletion
    records_to_delete := duplicate_group.motor_ids[2:array_length(duplicate_group.motor_ids, 1)];
    
    -- Log this cleanup operation
    cleanup_log := cleanup_log || jsonb_build_object(
      'model_display', duplicate_group.model_display,
      'total_records', duplicate_group.duplicate_count,
      'records_removed', array_length(records_to_delete, 1),
      'kept_record_id', duplicate_group.motor_ids[1]
    );
    
    -- Delete the duplicate records
    DELETE FROM motor_models WHERE id = ANY(records_to_delete);
    
    total_removed := total_removed + array_length(records_to_delete, 1);
    
    RAISE NOTICE 'Cleaned up % duplicates for model: %', 
      array_length(records_to_delete, 1), duplicate_group.model_display;
  END LOOP;
  
  RETURN QUERY SELECT total_removed, cleanup_log;
END;
$$;

-- Execute the cleanup function
SELECT * FROM public.cleanup_motor_duplicates_by_display();