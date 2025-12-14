-- Fix incorrect motor descriptions for 28 affected motors
-- This migration updates generic/wrong descriptions with family-appropriate content

-- Fix Pro XS motors with incorrect Verado/FourStroke descriptions
UPDATE motor_models
SET description = 'The Mercury 115hp Pro XS is purpose-built for tournament anglers and performance enthusiasts who demand the edge. Lighter weight, faster acceleration, and higher top-end speed than standard FourStrokes - this motor is engineered to win. Advanced fuel injection, performance-tuned gearcase, and race-proven reliability make it the choice of serious competitors.',
    updated_at = now()
WHERE horsepower = 115 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

UPDATE motor_models
SET description = 'The Mercury 150hp Pro XS is purpose-built for tournament anglers and performance enthusiasts who demand the edge. Lighter weight, faster acceleration, and higher top-end speed than standard FourStrokes - this motor is engineered to win. Advanced fuel injection, performance-tuned gearcase, and race-proven reliability make it the choice of serious competitors.',
    updated_at = now()
WHERE horsepower = 150 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

UPDATE motor_models
SET description = 'The Mercury 175hp Pro XS delivers tournament-winning performance in a package that''s lighter and faster than the competition. Purpose-built for bass boats and high-performance fishing rigs, it features advanced SmartCraft technology, a performance-tuned gearcase, and the explosive acceleration serious anglers demand.',
    updated_at = now()
WHERE horsepower = 175 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

UPDATE motor_models
SET description = 'The Mercury 200hp Pro XS delivers tournament-winning performance in a package that''s lighter and faster than the competition. Purpose-built for bass boats and high-performance fishing rigs, it features advanced SmartCraft technology, a performance-tuned gearcase, and the explosive acceleration serious anglers demand.',
    updated_at = now()
WHERE horsepower = 200 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

UPDATE motor_models
SET description = 'The Mercury 225hp Pro XS represents the pinnacle of tournament outboard performance. Engineered for competitive anglers who accept no compromise, it delivers class-leading acceleration, top-end speed, and all-day reliability. Advanced SmartCraft integration and legendary Mercury durability make this the weapon of choice for serious tournament fishermen.',
    updated_at = now()
WHERE horsepower = 225 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

UPDATE motor_models
SET description = 'The Mercury 250hp Pro XS represents the pinnacle of tournament outboard performance. Engineered for competitive anglers who accept no compromise, it delivers class-leading acceleration, top-end speed, and all-day reliability. Advanced SmartCraft integration and legendary Mercury durability make this the weapon of choice for serious tournament fishermen.',
    updated_at = now()
WHERE horsepower = 250 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

UPDATE motor_models
SET description = 'The Mercury 300hp Pro XS represents the pinnacle of tournament outboard performance. Engineered for competitive anglers who accept no compromise, it delivers class-leading acceleration, top-end speed, and all-day reliability. Advanced SmartCraft integration and legendary Mercury durability make this the weapon of choice for serious tournament fishermen.',
    updated_at = now()
WHERE horsepower = 300 AND (family ILIKE '%Pro%' OR model_display ILIKE '%Pro XS%');

-- Fix FourStroke motors with generic "cottage owners" description
UPDATE motor_models
SET description = 'The Mercury 5hp FourStroke is the ultimate portable outboard - lightweight, reliable, and built for years of dependable service. Perfect for dinghies, inflatables, canoes, and small jon boats, it delivers smooth, quiet power without the weight. Easy starting, fuel-efficient operation, and legendary Mercury quality make it the go-to choice for cottagers and sailors.',
    updated_at = now()
WHERE horsepower = 5 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 6hp FourStroke is the ultimate portable outboard - lightweight, reliable, and built for years of dependable service. Perfect for dinghies, inflatables, canoes, and small jon boats, it delivers smooth, quiet power without the weight. Easy starting, fuel-efficient operation, and legendary Mercury quality make it the go-to choice for cottagers and sailors.',
    updated_at = now()
WHERE horsepower = 6 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 9.9hp FourStroke delivers impressive performance in a portable package. Ideal for aluminum fishing boats, inflatables, and tenders, it offers the perfect balance of power and convenience. Electronic fuel injection ensures reliable starts in any weather, while excellent fuel economy keeps you on the water longer.',
    updated_at = now()
WHERE horsepower = 9.9 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 20hp FourStroke hits the sweet spot for versatility and value. Powerful enough for serious fishing yet efficient enough for all-day cruising, it''s the workhorse motor for aluminum boats, pontoons, and mid-sized inflatables. Advanced fuel injection, smooth acceleration, and remarkably quiet operation deliver a premium experience.',
    updated_at = now()
WHERE horsepower = 20 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 25hp FourStroke hits the sweet spot for versatility and value. Powerful enough for serious fishing yet efficient enough for all-day cruising, it''s the workhorse motor for aluminum boats, pontoons, and mid-sized inflatables. Advanced fuel injection, smooth acceleration, and remarkably quiet operation deliver a premium experience.',
    updated_at = now()
WHERE horsepower = 25 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 30hp FourStroke hits the sweet spot for versatility and value. Powerful enough for serious fishing yet efficient enough for all-day cruising, it''s the workhorse motor for aluminum boats, pontoons, and mid-sized inflatables. Advanced fuel injection, smooth acceleration, and remarkably quiet operation deliver a premium experience.',
    updated_at = now()
WHERE horsepower = 30 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 40hp FourStroke delivers the power and performance serious boaters demand. Engineered for pontoons, fishing boats, and center consoles, it combines responsive acceleration with excellent fuel economy. Advanced electronics, smooth four-stroke power, and Mercury''s legendary reliability mean you can focus on enjoying your time on the water.',
    updated_at = now()
WHERE horsepower = 40 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 50hp FourStroke delivers the power and performance serious boaters demand. Engineered for pontoons, fishing boats, and center consoles, it combines responsive acceleration with excellent fuel economy. Advanced electronics, smooth four-stroke power, and Mercury''s legendary reliability mean you can focus on enjoying your time on the water.',
    updated_at = now()
WHERE horsepower = 50 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 60hp FourStroke delivers the power and performance serious boaters demand. Engineered for pontoons, fishing boats, and center consoles, it combines responsive acceleration with excellent fuel economy. Advanced electronics, smooth four-stroke power, and Mercury''s legendary reliability mean you can focus on enjoying your time on the water.',
    updated_at = now()
WHERE horsepower = 60 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 75hp FourStroke delivers the power and performance serious boaters demand. Engineered for pontoons, fishing boats, and center consoles, it combines responsive acceleration with excellent fuel economy. Advanced electronics, smooth four-stroke power, and Mercury''s legendary reliability mean you can focus on enjoying your time on the water.',
    updated_at = now()
WHERE horsepower = 75 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 90hp FourStroke is built for boaters who demand serious performance. Whether you''re chasing fish offshore or cruising with family, this motor delivers responsive power, impressive fuel efficiency, and the refinement you expect from Mercury. Advanced SmartCraft technology, smooth acceleration, and proven reliability make it the choice of experienced boaters.',
    updated_at = now()
WHERE horsepower = 90 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 100hp FourStroke is built for boaters who demand serious performance. Whether you''re chasing fish offshore or cruising with family, this motor delivers responsive power, impressive fuel efficiency, and the refinement you expect from Mercury. Advanced SmartCraft technology, smooth acceleration, and proven reliability make it the choice of experienced boaters.',
    updated_at = now()
WHERE horsepower = 100 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 115hp FourStroke is built for boaters who demand serious performance. Whether you''re chasing fish offshore or cruising with family, this motor delivers responsive power, impressive fuel efficiency, and the refinement you expect from Mercury. Advanced SmartCraft technology, smooth acceleration, and proven reliability make it the choice of experienced boaters.',
    updated_at = now()
WHERE horsepower = 115 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

UPDATE motor_models
SET description = 'The Mercury 150hp FourStroke is built for boaters who demand serious performance. Whether you''re chasing fish offshore or cruising with family, this motor delivers responsive power, impressive fuel efficiency, and the refinement you expect from Mercury. Advanced SmartCraft technology, smooth acceleration, and proven reliability make it the choice of experienced boaters.',
    updated_at = now()
WHERE horsepower = 150 AND family = 'FourStroke' AND (description ILIKE '%cottage owners%exploring hidden coves%' OR description IS NULL);

-- Fix standard FourStrokes that might have incorrect Pro XS/Verado references
UPDATE motor_models
SET description = 'The Mercury 200hp FourStroke delivers exhilarating performance for serious offshore capability. Powerful V6 architecture provides explosive acceleration and impressive top-end speed, while advanced fuel injection ensures exceptional efficiency. Premium features, SmartCraft integration, and Mercury''s legendary build quality create an outboard that performs as good as it looks.',
    updated_at = now()
WHERE horsepower = 200 AND family = 'FourStroke' AND description ILIKE '%verado%' AND family NOT ILIKE '%verado%';

UPDATE motor_models
SET description = 'The Mercury 225hp FourStroke delivers exhilarating performance for serious offshore capability. Powerful V6 architecture provides explosive acceleration and impressive top-end speed, while advanced fuel injection ensures exceptional efficiency. Premium features, SmartCraft integration, and Mercury''s legendary build quality create an outboard that performs as good as it looks.',
    updated_at = now()
WHERE horsepower = 225 AND family = 'FourStroke' AND description ILIKE '%verado%' AND family NOT ILIKE '%verado%';

UPDATE motor_models
SET description = 'The Mercury 250hp FourStroke delivers exhilarating performance for serious offshore capability. Powerful V6 architecture provides explosive acceleration and impressive top-end speed, while advanced fuel injection ensures exceptional efficiency. Premium features, SmartCraft integration, and Mercury''s legendary build quality create an outboard that performs as good as it looks.',
    updated_at = now()
WHERE horsepower = 250 AND family = 'FourStroke' AND description ILIKE '%verado%' AND family NOT ILIKE '%verado%';

UPDATE motor_models
SET description = 'The Mercury 300hp FourStroke delivers exhilarating performance for serious offshore capability. Powerful V6 architecture provides explosive acceleration and impressive top-end speed, while advanced fuel injection ensures exceptional efficiency. Premium features, SmartCraft integration, and Mercury''s legendary build quality create an outboard that performs as good as it looks.',
    updated_at = now()
WHERE horsepower = 300 AND family = 'FourStroke' AND description ILIKE '%verado%' AND family NOT ILIKE '%verado%';