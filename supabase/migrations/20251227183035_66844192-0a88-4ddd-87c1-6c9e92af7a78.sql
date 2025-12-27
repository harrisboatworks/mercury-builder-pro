-- Voice Callbacks table for "Call Me Back" feature
CREATE TABLE public.voice_callbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT,
  customer_phone TEXT NOT NULL,
  preferred_time TEXT,
  callback_status TEXT DEFAULT 'pending' CHECK (callback_status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  notes TEXT,
  motor_interest TEXT,
  motor_context JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  scheduled_for TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id)
);

-- Voice Reminders table for "Remind Me" SMS feature
CREATE TABLE public.voice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  reminder_type TEXT CHECK (reminder_type IN ('motor', 'promotion', 'service', 'custom')),
  reminder_content JSONB,
  remind_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voice_callbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_callbacks (public insert, admin manage)
CREATE POLICY "Anyone can create callback requests"
  ON public.voice_callbacks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all callbacks"
  ON public.voice_callbacks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update callbacks"
  ON public.voice_callbacks FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for voice_reminders (public insert, admin manage)
CREATE POLICY "Anyone can create reminders"
  ON public.voice_reminders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all reminders"
  ON public.voice_reminders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reminders"
  ON public.voice_reminders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for cron job queries
CREATE INDEX idx_voice_reminders_pending ON public.voice_reminders(remind_at) WHERE sent = false;
CREATE INDEX idx_voice_callbacks_pending ON public.voice_callbacks(callback_status) WHERE callback_status = 'pending';