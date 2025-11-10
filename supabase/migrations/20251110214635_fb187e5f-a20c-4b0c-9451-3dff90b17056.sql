-- Create enum for application status
CREATE TYPE public.financing_application_status AS ENUM (
  'draft',
  'pending',
  'approved', 
  'declined',
  'more_info_needed',
  'withdrawn'
);

-- Create financing_applications table
CREATE TABLE public.financing_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- User association
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES public.customer_quotes(id) ON DELETE SET NULL,
  
  -- Application data (stored as JSONB for flexibility)
  purchase_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  applicant_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  employment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  financial_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  co_applicant_data JSONB DEFAULT NULL,
  references_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Encrypted sensitive data
  applicant_sin_encrypted TEXT,
  co_applicant_sin_encrypted TEXT,
  
  -- Application metadata
  status public.financing_application_status DEFAULT 'draft' NOT NULL,
  current_step INTEGER DEFAULT 1 NOT NULL CHECK (current_step BETWEEN 1 AND 7),
  completed_steps INTEGER[] DEFAULT '{}'::integer[] NOT NULL,
  
  -- Resume functionality
  resume_token TEXT UNIQUE,
  resume_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Processing information
  notes TEXT,
  processed_by TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Lead capture
  lead_source TEXT DEFAULT 'financing_form',
  source_url TEXT,
  
  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create indexes for performance
CREATE INDEX idx_financing_applications_user_id ON public.financing_applications(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_financing_applications_quote_id ON public.financing_applications(quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_financing_applications_status ON public.financing_applications(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_financing_applications_resume_token ON public.financing_applications(resume_token) WHERE resume_token IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_financing_applications_created_at ON public.financing_applications(created_at DESC) WHERE deleted_at IS NULL;

-- Create updated_at trigger
CREATE TRIGGER update_financing_applications_updated_at
  BEFORE UPDATE ON public.financing_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.financing_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.financing_applications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Anonymous users can view via resume token
CREATE POLICY "Anonymous users can view via resume token"
  ON public.financing_applications
  FOR SELECT
  TO anon
  USING (
    resume_token IS NOT NULL AND 
    resume_expires_at > now() AND
    deleted_at IS NULL
  );

-- Users can create their own applications
CREATE POLICY "Users can create own applications"
  ON public.financing_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can create draft applications
CREATE POLICY "Anonymous users can create draft applications"
  ON public.financing_applications
  FOR INSERT
  TO anon
  WITH CHECK (
    status = 'draft' AND 
    resume_token IS NOT NULL
  );

-- Users can update their own draft applications
CREATE POLICY "Users can update own draft applications"
  ON public.financing_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id);

-- Anonymous users can update via resume token
CREATE POLICY "Anonymous users can update via resume token"
  ON public.financing_applications
  FOR UPDATE
  TO anon
  USING (
    resume_token IS NOT NULL AND 
    resume_expires_at > now() AND
    status = 'draft' AND
    deleted_at IS NULL
  )
  WITH CHECK (status = 'draft');

-- Admins have full access
CREATE POLICY "Admins have full access to applications"
  ON public.financing_applications
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

COMMENT ON TABLE public.financing_applications IS 'Stores financing applications with encrypted sensitive data';