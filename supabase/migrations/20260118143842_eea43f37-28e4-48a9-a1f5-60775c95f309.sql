-- Add column to track which promotion a subscriber was last notified about
ALTER TABLE promo_reminder_subscriptions 
ADD COLUMN IF NOT EXISTS last_notified_promo_id UUID REFERENCES promotions(id);