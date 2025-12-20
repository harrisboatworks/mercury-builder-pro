-- Create saved_comparisons table for storing user motor comparisons
CREATE TABLE public.saved_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  motor_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;

-- Users can only view their own saved comparisons
CREATE POLICY "Users can view their own comparisons" 
  ON public.saved_comparisons 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own comparisons
CREATE POLICY "Users can create comparisons" 
  ON public.saved_comparisons 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comparisons
CREATE POLICY "Users can update their own comparisons" 
  ON public.saved_comparisons 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comparisons
CREATE POLICY "Users can delete their own comparisons" 
  ON public.saved_comparisons 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add index for faster user lookups
CREATE INDEX idx_saved_comparisons_user_id ON public.saved_comparisons(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_saved_comparisons_updated_at
  BEFORE UPDATE ON public.saved_comparisons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();