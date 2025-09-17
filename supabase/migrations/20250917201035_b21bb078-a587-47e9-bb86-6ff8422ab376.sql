-- Fix security issue: Add search_path to format_horsepower function
DROP FUNCTION IF EXISTS format_horsepower(numeric);

CREATE OR REPLACE FUNCTION format_horsepower(hp numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN hp = trunc(hp) THEN trunc(hp)::text
    ELSE hp::text
  END;
$$;