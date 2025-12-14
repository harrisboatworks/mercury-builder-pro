-- Fix incorrect motor descriptions for 2.5HP, 4HP, 8HP, and 15HP FourStroke motors
-- These were incorrectly showing SmartCraft digital gauges description

UPDATE motor_models
SET description = 'The Mercury 2.5hp FourStroke is the ultimate ultra-portable outboard - light enough to carry with one hand and reliable enough to count on every trip. Perfect for small inflatables, dinghies, canoes, and jon boats, it delivers smooth, quiet power that won''t disturb the fish or the neighbors. With built-in fuel tank, easy pull-start, and legendary Mercury dependability, it''s the go-to choice for cottagers, sailors, and anyone who needs simple, hassle-free boating.',
    updated_at = now()
WHERE model_number = '1F02201KK';

UPDATE motor_models
SET description = 'The Mercury 4hp FourStroke delivers impressive power in a surprisingly compact package. Ideal for dinghies, inflatables, and small fishing boats, it offers the perfect balance of portability and performance. With its integrated fuel tank, easy carry handle, and whisper-quiet operation, you''ll spend more time enjoying the water and less time fussing with your motor.',
    updated_at = now()
WHERE model_number = '1F04211KK';

UPDATE motor_models
SET description = 'The Mercury 8hp FourStroke strikes the sweet spot between portability and power. Light enough for easy transom mounting yet powerful enough to push aluminum boats and larger inflatables with authority. Features include electronic fuel injection for reliable starts, excellent fuel economy, and remarkably quiet operation - perfect for fishing, exploring, or just cruising your favorite lake.',
    updated_at = now()
WHERE model_number = '1A08211LK';

UPDATE motor_models
SET description = 'The Mercury 15hp FourStroke packs serious punch in a portable package. With electronic fuel injection, power tilt, and the smoothest, quietest operation in its class, it''s the go-to choice for aluminum fishing boats, pontoon kickers, and medium-sized inflatables. Legendary Mercury reliability means you can fish longer, explore further, and always get back to the dock.',
    updated_at = now()
WHERE model_number = '1A15412LK';