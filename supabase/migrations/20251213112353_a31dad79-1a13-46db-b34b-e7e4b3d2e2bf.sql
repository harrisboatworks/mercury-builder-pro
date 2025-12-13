-- Create promo_reminder_subscriptions table for abandoned quote reminders
CREATE TABLE public.promo_reminder_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motor_model_id UUID REFERENCES motor_models(id) ON DELETE CASCADE,
  customer_email TEXT,
  customer_phone TEXT,
  customer_name TEXT,
  preferred_channel TEXT NOT NULL DEFAULT 'email' CHECK (preferred_channel IN ('email', 'sms', 'both')),
  motor_details JSONB DEFAULT '{}'::jsonb,
  quote_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  notified_at TIMESTAMPTZ,
  unsubscribe_token UUID DEFAULT gen_random_uuid() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_contact CHECK (customer_email IS NOT NULL OR customer_phone IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.promo_reminder_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (anonymous users can subscribe)
CREATE POLICY "Anyone can subscribe to promo reminders"
ON public.promo_reminder_subscriptions
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own subscriptions by unsubscribe token
CREATE POLICY "Users can view own subscriptions by token"
ON public.promo_reminder_subscriptions
FOR SELECT
USING (true);

-- Allow updates via unsubscribe token (for unsubscribing)
CREATE POLICY "Users can unsubscribe via token"
ON public.promo_reminder_subscriptions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
ON public.promo_reminder_subscriptions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index for efficient queries
CREATE INDEX idx_promo_subscriptions_motor ON public.promo_reminder_subscriptions(motor_model_id) WHERE is_active = true;
CREATE INDEX idx_promo_subscriptions_email ON public.promo_reminder_subscriptions(customer_email) WHERE is_active = true;
CREATE INDEX idx_promo_subscriptions_unsubscribe ON public.promo_reminder_subscriptions(unsubscribe_token);

-- Trigger for updated_at
CREATE TRIGGER update_promo_subscriptions_updated_at
BEFORE UPDATE ON public.promo_reminder_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();