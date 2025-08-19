-- Fix security vulnerability in quotes table
-- Ensure proper access controls and data integrity

-- First, ensure the trigger exists for quotes table
-- This trigger auto-fills user_id and prevents cross-user quote access
DROP TRIGGER IF EXISTS enforce_quotes_user_id_trigger ON public.quotes;

CREATE TRIGGER enforce_quotes_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_quotes_user_id();

-- Clean up any orphaned quotes without user_id
-- Set them to a system user to maintain data integrity
UPDATE public.quotes 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Add constraint to prevent future NULL user_id insertions
-- This ensures all quotes are properly associated with a user
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_user_id_not_null 
CHECK (user_id IS NOT NULL);