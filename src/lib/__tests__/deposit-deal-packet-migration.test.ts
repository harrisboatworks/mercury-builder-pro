import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260823120000_deposit_deal_packet.sql',
  'utf8',
);

describe('deposit deal-packet migration', () => {
  it('adds identity/address and promoted Stripe join columns without rewriting history', () => {
    expect(migration).toContain('ALTER TABLE public.saved_quotes');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS customer_full_name text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS customer_address_line1 text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS customer_country text');
    expect(migration).toContain('ALTER TABLE public.customer_quotes');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS saved_quote_id uuid REFERENCES public.saved_quotes(id)');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS payment_status text');
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS stripe_billing_address jsonb');
    expect(migration).not.toMatch(/ALTER COLUMN .* SET NOT NULL/);
  });

  it('enforces one deposit row per saved quote and one row per checkout session', () => {
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS customer_quotes_one_deposit_per_saved_quote');
    expect(migration).toContain('WHERE saved_quote_id IS NOT NULL AND lead_source = \'deposit\'');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS customer_quotes_one_row_per_checkout_session');
    expect(migration).toContain('WHERE stripe_checkout_session_id IS NOT NULL');
  });

  it('creates a private delivery table with admin read and no public write policy', () => {
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.deposit_email_deliveries');
    expect(migration).toContain("audience text NOT NULL CHECK (audience IN ('customer', 'hbw', 'grok_bot'))");
    expect(migration).toContain("status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed'))");
    expect(migration).toContain('claim_token uuid');
    expect(migration).toContain('claim_expires_at timestamptz');
    expect(migration).toContain('UNIQUE (customer_quote_id, audience)');
    expect(migration).toContain('ALTER TABLE public.deposit_email_deliveries ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain('REVOKE ALL ON TABLE public.deposit_email_deliveries FROM PUBLIC, anon');
    expect(migration).toContain('GRANT SELECT ON TABLE public.deposit_email_deliveries TO authenticated');
    expect(migration).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE public.deposit_email_deliveries TO service_role');
    expect(migration).toContain('CREATE POLICY "Admins can read deposit email deliveries"');
    expect(migration).toContain("USING (public.has_role(auth.uid(), 'admin'::public.app_role))");
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.claim_deposit_email_delivery');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.complete_deposit_email_delivery');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.fail_deposit_email_delivery');
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('SET search_path = pg_catalog');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.claim_deposit_email_delivery(uuid, text, uuid, integer) FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.claim_deposit_email_delivery(uuid, text, uuid, integer) TO service_role');
    expect(migration).not.toContain('pg_catalog.coalesce');
    expect(migration).not.toContain('pg_catalog.nullif');
    expect(migration).toContain('lease_seconds := GREATEST(COALESCE(p_lease_seconds, 120), 15);');
    expect(migration).not.toContain('pg_catalog.greatest');
    expect(migration).not.toMatch(/FOR INSERT/);
    expect(migration).not.toMatch(/FOR UPDATE/);
    expect(migration).not.toMatch(/GRANT .* ON TABLE public\.deposit_email_deliveries TO anon/);
    expect(migration).not.toMatch(/GRANT .* ON TABLE public\.deposit_email_deliveries TO PUBLIC/i);
  });

  it('promotes unambiguous historical joins without seeding deliveries, inventing billing, or promoting paid from JSON', () => {
    expect(migration).toContain("SET saved_quote_id = (cq.quote_data->>'saved_quote_id')::uuid");
    expect(migration).toContain("FROM public.saved_quotes AS sq");
    expect(migration).toContain("WHERE sq.id = (cq.quote_data->>'saved_quote_id')::uuid");
    expect(migration).toContain("SET stripe_checkout_session_id = cq.quote_data->>'stripe_session_id'");
    expect(migration).toContain("WHERE cq.lead_source = 'deposit'");
    expect(migration).toContain("~ '^cs_(test_|live_)?[A-Za-z0-9]+$'");
    expect(migration).toContain("~ '^pi_(test_|live_)?[A-Za-z0-9]+$'");
    expect(migration).toContain('promote paid state from customer-editable JSON');
    expect(migration).toContain('deposit_email_deliveries for historical rows');
    expect(migration).not.toMatch(/INSERT INTO public\.deposit_email_deliveries/i);
    expect(migration).not.toMatch(/SET stripe_billing_address/i);
    expect(migration).not.toMatch(/SET\s+deposit_status\s*=\s*'paid'/);
    expect(migration).not.toMatch(/quote_data->>'payment_status' IN/);
    expect(migration).not.toContain("SET payment_status = cq.quote_data->>'payment_status'");
  });

  it('rejects owner updates to deposit authority and bound identity with least-privilege triggers', () => {
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.deposit_authority_caller()');
    expect(migration).toContain("auth.role() IS NOT DISTINCT FROM 'service_role'");
    expect(migration).toContain("public.has_role(auth.uid(), 'admin'::public.app_role)");
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_deposit_authority()');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.enforce_saved_quotes_deposit_authority()');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.enforce_saved_quote_bound_identity()');
    expect(migration).toContain('SET search_path = pg_catalog');
    expect(migration).toContain('deposit records are service-managed');
    expect(migration).toContain('deposit payment fields are service-managed');
    expect(migration).toContain('saved quote deposit fields are service-managed');
    expect(migration).toContain('bound saved quote identity is immutable');
    expect(migration).toContain("NEW.deposit_status IS DISTINCT FROM 'pending'");
    expect(migration).toContain('BEFORE INSERT OR UPDATE ON public.customer_quotes');
    expect(migration).toContain('NEW.saved_quote_id IS NOT NULL');
    expect(migration).toContain('NEW.stripe_checkout_session_id IS NOT NULL');
    expect(migration).toContain('NEW.stripe_payment_intent_id IS NOT NULL');
    expect(migration).toContain('NEW.payment_status IS NOT NULL');
    expect(migration).toContain('NEW.payment_paid_at IS NOT NULL');
    expect(migration).toContain('NEW.stripe_billing_address IS NOT NULL');
    expect(migration).toContain('BEFORE DELETE ON public.customer_quotes');
    expect(migration).toContain('CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_deposit_delete()');
    expect(migration).toContain('RETURN OLD;');
    expect(migration).toContain('BEFORE INSERT OR UPDATE OF deposit_status, deposit_amount, deposit_paid_at');
    expect(migration).toContain('BEFORE UPDATE OF quote_state, email, customer_full_name, customer_phone');
    expect(migration).toContain("old_data->>'deposit_outbox_schema'");
    expect(migration).toContain("old_data->'motor_info'");
    expect(migration).toContain("old_data->'quote_snapshot'");
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.deposit_authority_caller() FROM PUBLIC, anon, authenticated, service_role');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.deposit_quote_data_authority_changed(jsonb, jsonb) FROM PUBLIC, anon, authenticated, service_role');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.deposit_authority_caller() TO anon, authenticated, service_role');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.deposit_quote_data_authority_changed(jsonb, jsonb) TO anon, authenticated, service_role');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.enforce_customer_quotes_deposit_authority() FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.enforce_customer_quotes_deposit_delete() FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.enforce_saved_quotes_deposit_authority() FROM PUBLIC, anon, authenticated');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.enforce_saved_quote_bound_identity() FROM PUBLIC, anon, authenticated');
    expect(migration).not.toMatch(/FUNCTION public\.enforce_customer_quotes_deposit_authority\(\)\s+RETURNS trigger\s+LANGUAGE plpgsql\s+SECURITY DEFINER/);
    expect(migration).not.toMatch(/FUNCTION public\.enforce_customer_quotes_deposit_delete\(\)\s+RETURNS trigger\s+LANGUAGE plpgsql\s+SECURITY DEFINER/);
    expect(migration).not.toMatch(/FUNCTION public\.enforce_saved_quotes_deposit_authority\(\)\s+RETURNS trigger\s+LANGUAGE plpgsql\s+SECURITY DEFINER/);
    expect(migration).not.toMatch(/FUNCTION public\.enforce_saved_quote_bound_identity\(\)\s+RETURNS trigger\s+LANGUAGE plpgsql\s+SECURITY DEFINER/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.enforce_customer_quotes_deposit_authority/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.enforce_customer_quotes_deposit_delete/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.enforce_saved_quotes_deposit_authority/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.enforce_saved_quote_bound_identity/);
    expect(migration.indexOf('REVOKE ALL ON FUNCTION public.deposit_authority_caller()'))
      .toBeLessThan(migration.indexOf('GRANT EXECUTE ON FUNCTION public.deposit_authority_caller()'));
    expect(migration.indexOf('REVOKE ALL ON FUNCTION public.deposit_quote_data_authority_changed(jsonb, jsonb)'))
      .toBeLessThan(migration.indexOf('GRANT EXECUTE ON FUNCTION public.deposit_quote_data_authority_changed(jsonb, jsonb)'));
    expect(migration).toContain('IF public.deposit_authority_caller() THEN\n    RETURN OLD;');
  });
});
