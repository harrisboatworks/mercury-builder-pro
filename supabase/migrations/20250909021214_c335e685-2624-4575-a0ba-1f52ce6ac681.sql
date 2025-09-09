-- Create warranty pricing table
CREATE TABLE public.warranty_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hp_min NUMERIC NOT NULL,
  hp_max NUMERIC NOT NULL,
  year_1_price NUMERIC NOT NULL,
  year_2_price NUMERIC NOT NULL,
  year_3_price NUMERIC NOT NULL,
  year_4_price NUMERIC NOT NULL,
  year_5_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.warranty_pricing ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (warranty pricing should be publicly viewable)
CREATE POLICY "Public read access for warranty_pricing" 
ON public.warranty_pricing 
FOR SELECT 
USING (true);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_warranty_pricing_updated_at
BEFORE UPDATE ON public.warranty_pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert warranty pricing data from Harris website
INSERT INTO public.warranty_pricing (hp_min, hp_max, year_1_price, year_2_price, year_3_price, year_4_price, year_5_price) VALUES
(2.5, 14.9, 76, 137, 194, 247, 293),
(15, 39.9, 178, 319, 454, 576, 684),
(40, 74.9, 355, 639, 904, 1149, 1365),
(75, 149.9, 539, 971, 1376, 1748, 2077),
(150, 199.9, 753, 1357, 1921, 2442, 2900),
(200, 299.9, 1809, 3256, 4612, 5861, 6964),
(300, 399.9, 2580, 4644, 6579, 8358, 9932),
(400, 400, 3593, 6468, 9162, 11642, 13833),
(425, 425, 3760, 6770, 9589, 12183, 14478),
(500, 500, 4870, 8766, 12417, 15777, 18748),
(600, 600, 5836, 10504, 14881, 18908, 22469);