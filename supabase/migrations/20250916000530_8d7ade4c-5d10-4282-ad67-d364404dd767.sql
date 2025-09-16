-- Create function to get duplicate brochure keys
CREATE OR REPLACE FUNCTION get_duplicate_brochure_keys()
RETURNS TABLE(model_key text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT m.model_key, COUNT(*) as count
  FROM motor_models m
  WHERE m.is_brochure = true
  GROUP BY m.model_key
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;