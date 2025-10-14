-- Update 9.9 MH motor to in stock status
UPDATE motor_models 
SET 
  in_stock = true,
  stock_quantity = 1,
  availability = 'In Stock',
  last_stock_check = now(),
  updated_at = now()
WHERE id = 'e920cfdf-223a-408a-850b-6f112e15c4d7';