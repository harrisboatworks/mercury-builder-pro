-- Add dynamic fields for PDF spec sheet improvements
-- These fields will be stored in the specifications JSON column for flexibility

-- Update motor_models table to include new dynamic operating specifications
-- Adding these as computed fields that can be populated via admin interface or scraped data

-- Add comment to table to document the new fields structure
COMMENT ON COLUMN motor_models.specifications IS 'JSON field containing motor specifications including: fuelConsumption, soundLevel, recommendedBoatSize, maxBoatWeight, and other technical specs';

-- Create a function to get operating specs with fallback values
CREATE OR REPLACE FUNCTION get_motor_operating_specs(
  hp numeric,
  motor_type text DEFAULT 'Outboard',
  specifications jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN jsonb_build_object(
    'fuelConsumption', 
    COALESCE(
      specifications->>'fuelConsumption',
      CASE 
        WHEN hp <= 6 THEN '0.5-1.0 gal/hr @ cruise'
        WHEN hp <= 15 THEN '1.0-2.0 gal/hr @ cruise'
        WHEN hp <= 30 THEN '2.0-3.5 gal/hr @ cruise'
        WHEN hp <= 60 THEN '4.0-6.0 gal/hr @ cruise'
        WHEN hp <= 90 THEN '6.5-9.0 gal/hr @ cruise'
        WHEN hp <= 115 THEN '8.5-11.0 gal/hr @ cruise'
        WHEN hp <= 150 THEN '11.0-15.0 gal/hr @ cruise'
        ELSE '15+ gal/hr @ cruise'
      END
    ),
    'soundLevel',
    COALESCE(
      specifications->>'soundLevel',
      CASE
        WHEN hp <= 6 THEN '55 dB @ idle, 75 dB @ WOT'
        WHEN hp <= 15 THEN '58 dB @ idle, 78 dB @ WOT'
        WHEN hp <= 30 THEN '60 dB @ idle, 80 dB @ WOT'
        WHEN hp <= 60 THEN '62 dB @ idle, 82 dB @ WOT'
        WHEN hp <= 90 THEN '64 dB @ idle, 84 dB @ WOT'
        WHEN hp <= 115 THEN '66 dB @ idle, 86 dB @ WOT'
        WHEN hp <= 150 THEN '68 dB @ idle, 88 dB @ WOT'
        ELSE '70 dB @ idle, 90 dB @ WOT'
      END
    ),
    'recommendedBoatSize',
    COALESCE(
      specifications->>'recommendedBoatSize',
      CASE
        WHEN hp <= 6 THEN 'Up to 12 ft'
        WHEN hp <= 15 THEN '12-16 ft'
        WHEN hp <= 30 THEN '14-18 ft'
        WHEN hp <= 60 THEN '16-20 ft'
        WHEN hp <= 90 THEN '18-22 ft'
        WHEN hp <= 115 THEN '20-24 ft'
        WHEN hp <= 150 THEN '22-26 ft'
        WHEN hp <= 200 THEN '24-28 ft'
        ELSE '26+ ft'
      END
    ),
    'maxBoatWeight',
    COALESCE(
      specifications->>'maxBoatWeight',
      CASE
        WHEN hp <= 6 THEN '1,200 lbs'
        WHEN hp <= 15 THEN '2,500 lbs'
        WHEN hp <= 30 THEN '3,500 lbs'
        WHEN hp <= 60 THEN '5,000 lbs'
        WHEN hp <= 90 THEN '6,500 lbs'
        WHEN hp <= 115 THEN '8,000 lbs'
        WHEN hp <= 150 THEN '10,000 lbs'
        WHEN hp <= 200 THEN '12,000 lbs'
        ELSE '15,000+ lbs'
      END
    )
  );
END;
$$;