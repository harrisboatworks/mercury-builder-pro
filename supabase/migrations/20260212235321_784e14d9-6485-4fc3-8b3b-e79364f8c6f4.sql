
-- Create table for TikTok OAuth tokens
CREATE TABLE public.tiktok_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tiktok_tokens ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view TikTok tokens"
ON public.tiktok_tokens
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert TikTok tokens"
ON public.tiktok_tokens
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update TikTok tokens"
ON public.tiktok_tokens
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete TikTok tokens"
ON public.tiktok_tokens
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tiktok_tokens_updated_at
BEFORE UPDATE ON public.tiktok_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
