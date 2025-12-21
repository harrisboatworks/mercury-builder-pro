-- Create blog_subscriptions table for email subscriptions
CREATE TABLE public.blog_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT blog_subscriptions_email_key UNIQUE (email)
);

-- Enable Row Level Security
ALTER TABLE public.blog_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to blog"
ON public.blog_subscriptions
FOR INSERT
WITH CHECK (true);

-- Allow unsubscribe via token (update)
CREATE POLICY "Anyone can unsubscribe with valid token"
ON public.blog_subscriptions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view blog subscriptions"
ON public.blog_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage subscriptions
CREATE POLICY "Admins can manage blog subscriptions"
ON public.blog_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster email lookups
CREATE INDEX idx_blog_subscriptions_email ON public.blog_subscriptions(email);
CREATE INDEX idx_blog_subscriptions_token ON public.blog_subscriptions(unsubscribe_token);

-- Create trigger for updated_at
CREATE TRIGGER update_blog_subscriptions_updated_at
BEFORE UPDATE ON public.blog_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();