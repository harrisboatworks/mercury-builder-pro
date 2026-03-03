
-- Drop the check constraint that enforces user_id NOT NULL
ALTER TABLE public.customer_quotes DROP CONSTRAINT IF EXISTS customer_quotes_user_id_not_null;

-- Insert missing deposit record for Carlos Pimenta
INSERT INTO public.customer_quotes (
  customer_name, customer_email, customer_phone,
  base_price, final_price, deposit_amount, total_cost,
  loan_amount, monthly_payment, term_months,
  lead_status, lead_source, is_admin_quote,
  notes, admin_notes,
  quote_data, created_at, anonymous_session_id
) VALUES (
  'Carlos Negrao Pimenta',
  'carlosnpimenta@gmail.com',
  NULL,
  0, 0, 200, 0,
  0, 0, 0,
  'scheduled', 'deposit', true,
  'Customer reference: 100868408072',
  'Stripe deposit $200 paid Feb 27, 2026 via Afterpay. Payment intent: pi_3T5boAHhVKClVQCp0rY7UB5c. Record created manually — original deposit was not captured due to missing webhook/pre-save.',
  '{"deposit_amount": "200", "payment_type": "motor_deposit", "stripe_payment_intent": "pi_3T5boAHhVKClVQCp0rY7UB5c", "motor_interest": "9.9 HP", "payment_method": "afterpay", "customer_reference": "100868408072"}'::jsonb,
  '2026-02-27T00:00:00Z',
  'manual-recovery-carlos-pimenta'
);
