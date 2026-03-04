

## Testing the Deposit Flow

The core issue: Stripe test cards only work when Stripe is in **test mode**. If `4242 4242 4242 4242` was rejected, your Stripe account is in **live mode**, which means test cards won't work.

### Options

**Option A: Switch Stripe to test mode temporarily**
- In your Stripe Dashboard, toggle the "Test mode" switch (top-right)
- Copy the **test mode** secret key (starts with `sk_test_`)
- Update the `STRIPE_SECRET_KEY` secret in Supabase to the test key
- Update `STRIPE_WEBHOOK_SECRET` to the test webhook secret
- Run through the full deposit flow with `4242 4242 4242 4242`
- Switch everything back to live keys when done

This is the proper way to test without spending money.

**Option B: Test everything except the Stripe redirect**
- We can verify the **pre-Stripe** portion right now by checking:
  1. The deposit dialog collects name/email/phone
  2. The PDF is generated and uploaded to storage before redirect
  3. The `saved_quotes` record is created with the correct metadata
  4. The `create-payment` edge function returns a valid Stripe session URL
- The **post-Stripe** portion (webhook → email → My Quotes badge) would remain untested until a real or test-mode payment goes through

**Option C: Create a $1 test price**
- Create a `$1.00 CAD` Stripe price for testing purposes
- Temporarily wire it as the deposit price for a specific HP range
- Pay the $1, verify the full chain works, then remove it

### Recommendation

**Option A** is the standard approach. You'd:
1. Toggle test mode in Stripe Dashboard
2. I update the Supabase secret to `sk_test_...`
3. You run through the quote → reserve → pay flow
4. We verify email PDF + My Quotes page
5. Switch back to live keys

No code changes needed — just a secret swap.

