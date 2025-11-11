-- Final Security Hardening: Add search_path to remaining functions
-- This prevents search path manipulation attacks

-- Fix cleanup_motor_duplicates_by_display
CREATE OR REPLACE FUNCTION public.cleanup_motor_duplicates_by_display()
 RETURNS TABLE(total_duplicates_removed integer, cleanup_details jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  duplicate_group RECORD;
  records_to_delete uuid[];
  total_removed integer := 0;
  cleanup_log jsonb := '[]'::jsonb;
BEGIN
  FOR duplicate_group IN
    SELECT 
      model_display,
      COUNT(*) as duplicate_count,
      ARRAY_AGG(id ORDER BY 
        CASE WHEN is_brochure THEN 1 ELSE 2 END,
        CASE WHEN in_stock THEN 1 ELSE 2 END,
        CASE WHEN dealer_price IS NOT NULL THEN 1 ELSE 2 END,
        created_at DESC
      ) as motor_ids
    FROM motor_models 
    WHERE model_display IS NOT NULL 
      AND trim(model_display) != ''
    GROUP BY model_display
    HAVING COUNT(*) > 1
  LOOP
    records_to_delete := duplicate_group.motor_ids[2:array_length(duplicate_group.motor_ids, 1)];
    cleanup_log := cleanup_log || jsonb_build_object(
      'model_display', duplicate_group.model_display,
      'total_records', duplicate_group.duplicate_count,
      'records_removed', array_length(records_to_delete, 1),
      'kept_record_id', duplicate_group.motor_ids[1]
    );
    DELETE FROM motor_models WHERE id = ANY(records_to_delete);
    total_removed := total_removed + array_length(records_to_delete, 1);
  END LOOP;
  RETURN QUERY SELECT total_removed, cleanup_log;
END;
$function$;

-- Fix get_duplicate_brochure_keys
CREATE OR REPLACE FUNCTION public.get_duplicate_brochure_keys()
 RETURNS TABLE(model_key text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT m.model_key, COUNT(*) as count
  FROM motor_models m
  WHERE m.is_brochure = true
  GROUP BY m.model_key
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$function$;