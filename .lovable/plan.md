

## Implementation Plan: Fix Deposit Record Gap + Carlos Pimenta Record

### Overview
Four changes to ensure deposit payments are always tracked and to create the missing record for Carlos Pimenta.

---

### 1. Database Migration — Make `user_id` nullable + update RLS

**File**: New migration file

```sql
-- Make user_id nullable for guest deposit payments
ALTER TABLE public.customer_quotes ALTER COLUMN user_id DROP NOT NULL;

-- Update anonymous insert policy to allow 'deposit' lead_source
DROP POLICY IF EXISTS "Allow anonymous quote creation with session ID" ON public.customer_quotes;
CREATE POLICY "Allow anonymous quote creation with session ID"
  ON public.customer_quotes
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL) 
    AND (anonymous_session_id IS NOT NULL) 
    AND (lead_source = ANY (ARRAY['pdf_download', 'consultation', 'deposit']))
  );
```

---

### 2. Insert Carlos Pimenta's Record

Using the service role (via the insert tool), create the missing deposit record:

```sql
INSERT INTO public.customer_quotes (
  customer_name, customer_email, customer_phone,
  base_price, final_price, deposit_amount, total_cost,
  loan_amount, monthly_payment, term_months,
  lead_status, lead_source, is_admin_quote,
  notes, admin_notes,
  quote_data, created_at
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
  '2026-02-27T00:00:00Z'
);
```

---

### 3. Update `create-payment` Edge Function — Save deposit records before Stripe redirect

**File**: `supabase/functions/create-payment/index.ts`

After the Stripe checkout session is created for deposits (line ~164), and before returning the response, insert a record into `customer_quotes` using the service role client:

- Move `supabaseService` initialization earlier (before the deposit branch, around line 115)
- After `const session = await stripe.checkout.sessions.create(sessionData)`, add:

```typescript
// Save deposit record to customer_quotes BEFORE returning checkout URL
try {
  const { error: depositSaveError } = await supabaseService.from("customer_quotes").insert({
    user_id: user?.id || null,
    anonymous_session_id: user ? null : (session.id || crypto.randomUUID()),
    customer_name: customerName,
    customer_email: userEmail || customerInfo?.email || "",
    base_price: 0,
    final_price: 0,
    deposit_amount: parseInt(depositAmount),
    total_cost: 0,
    loan_amount: 0,
    monthly_payment: 0,
    term_months: 0,
    lead_status: "downloaded",  // Will be updated to 'scheduled' by webhook
    lead_source: "deposit",
    quote_data: {
      deposit_amount: depositAmount,
      payment_type: "motor_deposit",
      stripe_session_id: session.id,
      payment_status: "pending",
      motor_info: motorInfo,
    },
  });
  if (depositSaveError) {
    logStep("WARNING: Failed to save deposit record", { error: depositSaveError.message });
  } else {
    logStep("Deposit record saved to customer_quotes");
  }
} catch (saveErr) {
  logStep("WARNING: Exception saving deposit record", { error: saveErr instanceof Error ? saveErr.message : String(saveErr) });
}
```

This is wrapped in try/catch so a DB failure won't block the payment flow.

---

### 4. Update `stripe-webhook` — Confirm existing deposit records

**File**: `supabase/functions/stripe-webhook/index.ts`

Inside the `if (session.metadata?.payment_type === "motor_deposit")` block (after line ~98), before sending the email, add logic to find and update the existing `customer_quotes` record:

```typescript
// Update existing deposit record status to 'scheduled' (payment confirmed)
const { data: existingDeposit, error: findError } = await supabase
  .from("customer_quotes")
  .select("id")
  .eq("lead_source", "deposit")
  .contains("quote_data", { stripe_session_id: session.id })
  .maybeSingle();

if (existingDeposit) {
  const { error: updateError } = await supabase
    .from("customer_quotes")
    .update({
      lead_status: "scheduled",
      quote_data: {
        deposit_amount: depositAmount,
        payment_type: "motor_deposit",
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntentId,
        payment_status: "paid",
        motor_info: motorInfo,
      },
    })
    .eq("id", existingDeposit.id);

  if (updateError) {
    logStep("ERROR: Failed to update deposit record", { error: updateError.message });
  } else {
    logStep("Deposit record updated to scheduled", { quoteId: existingDeposit.id });
  }
} else {
  logStep("No existing deposit record found for session", { sessionId: session.id });
}
```

---

### Summary

| Step | What | Why |
|------|------|-----|
| Migration | `user_id` nullable + RLS update | Guest deposits have no auth user |
| Data insert | Carlos Pimenta record | Recover the missing $200 deposit |
| create-payment | Save record before Stripe redirect | Never lose a deposit again |
| stripe-webhook | Update record on payment success | Mark deposits as confirmed |

