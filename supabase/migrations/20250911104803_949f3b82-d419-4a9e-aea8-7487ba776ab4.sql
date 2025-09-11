-- Add images array to motor_models table for multiple product images
ALTER TABLE public.motor_models 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance on images
CREATE INDEX idx_motor_models_images ON public.motor_models USING GIN (images);

-- Add comment for documentation
COMMENT ON COLUMN public.motor_models.images IS 'Array of image URLs for product gallery - includes thumbnails, details, and various angles';