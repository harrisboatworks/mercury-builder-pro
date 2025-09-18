-- Add RLS policies to allow admin access to motor_models table
-- This fixes the exclude functionality by giving admins UPDATE permissions

-- Add policy for admin updates (this is the main fix for exclude functionality)
CREATE POLICY "Admins can update motor_models" ON public.motor_models
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admin inserts (for completeness)
CREATE POLICY "Admins can insert motor_models" ON public.motor_models
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admin deletes (for completeness)  
CREATE POLICY "Admins can delete motor_models" ON public.motor_models
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));