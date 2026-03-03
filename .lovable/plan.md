

## Testing Status

The quote builder flow works end-to-end through all steps:
1. Motor Selection → 9.9HP Command Thrust selected
2. Options → Fuel tank pre-selected, continued
3. Purchase Path → Loose Motor selected
4. Trade-In → Skipped (No trade-in)
5. Promo → Factory Rebate ($250) selected
6. Package → Essential selected
7. **Summary page loaded correctly** with accurate pricing and the "Reserve with $200 deposit" button

## What Still Needs Testing

The critical piece — clicking "Reserve with $200 deposit" — requires **you to test manually** because:

1. **Authentication**: You need to be logged in for the `saved_quotes` record to link to your account. The browser automation doesn't share your login session.
2. **Stripe redirect**: The deposit flow opens Stripe Checkout in a new tab, which browser automation cannot follow.
3. **Email verification**: You need to check your inbox for the deposit-confirmed PDF after completing the Stripe test payment.

## Manual Test Steps

1. **Log in** to the site (Sign In button, top right)
2. **Configure a quote** (motor → options → purchase path → trade-in → promo → package → summary) — or resume if your session persists
3. **Click "Reserve with $200 deposit"**
4. **Fill in the deposit dialog** (name, email, phone) — watch the console for:
   - `"Deposit-confirmed PDF uploaded:"` — confirms the React PDF with depositInfo was generated and stored
   - `"Saved quote created for deposit tracking:"` — confirms the saved_quotes record was created
5. **Complete the Stripe test payment** in the new tab
6. **Check your email** — the PDF attached should be the professional React PDF with the green "DEPOSIT CONFIRMED" section, not the old ugly pdf-lib version
7. **Check My Quotes page** (`/account/my-quotes`) — should show the quote with a green "Deposit Paid" badge

## Edge Functions to Deploy

Before testing, make sure these updated edge functions are deployed:
- `send-deposit-confirmation-email` (gutted the pdf-lib stamping)
- `stripe-webhook` (now updates saved_quotes with deposit status)
- `create-payment` (now passes savedQuoteId through metadata)

You can verify deployment status at the Supabase dashboard Edge Functions page.

