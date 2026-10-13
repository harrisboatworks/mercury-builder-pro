-- Match pre-existing application columns absent from the older local stub.
ALTER TABLE public.saved_quotes ADD COLUMN user_id uuid, ADD COLUMN is_soft_lead boolean DEFAULT false;
ALTER TABLE public.customer_quotes ADD COLUMN user_id uuid, ADD COLUMN customer_phone text, ADD COLUMN deposit_amount numeric, ADD COLUMN motor_model_id uuid,
  ADD COLUMN base_price numeric DEFAULT 0, ADD COLUMN final_price numeric DEFAULT 0,
  ADD COLUMN total_cost numeric DEFAULT 0, ADD COLUMN loan_amount numeric DEFAULT 0,
  ADD COLUMN monthly_payment numeric DEFAULT 0, ADD COLUMN term_months integer DEFAULT 0,
  ADD COLUMN penalty_applied boolean DEFAULT false, ADD COLUMN lead_status text;
