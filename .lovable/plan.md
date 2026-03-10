

# Investigation Results: The SMS Amount vs Share Link Discrepancy

## What I Found

The actual quote (`b44bab77`) data from the database:

- Motor: 150HP, base_price $18,300, MSRP $25,165 (or similar 150HP variant)
- Trade-in: $9,975
- Rebate: $650
- Agent's `finalPrice`: **$8,971.75**

The **$38.87 difference** comes from one thing:

### DealerPlan Fee ($299) — taxed vs untaxed

- **Agent API** (line 124): Adds $299 **after** HST → untaxed
  - `$7,675 × 1.13 + $299 = $8,971.75`
- **Frontend** (QuoteSummaryPage line 276): Includes $299 **in subtotal before** HST → taxed
  - `($7,675 + $299) × 1.13 = $9,010.62`

### But the bigger issue you raised: the $299 shouldn't be in the total at all

Per your policy (confirmed in memory: `hidden-dealerplan-fee-logic`), the $299 is a financing-only cost. It shouldn't be part of the quote's displayed total — it should only appear in monthly payment calculations.

Currently **both** the agent API and the frontend are including it in the total price. The frontend even passes `financingFee: DEALERPLAN_FEE` into `calculateQuotePricing` which bakes it into the subtotal shown to the customer.

## Proposed Fix (conservative, minimal risk)

### 1. Agent API — remove $299 from finalPrice

In `supabase/functions/agent-quote-api/index.ts`, line 124:

```
// BEFORE:
const totalBeforeDiscount = adjustedSubtotal + hst + DEALERPLAN_FEE;

// AFTER:
const totalBeforeDiscount = adjustedSubtotal + hst;
```

Keep `dealerplanFee: DEALERPLAN_FEE` in the return object (informational for financing calcs). The SMS will now show the price without the hidden fee.

### 2. Frontend — remove $299 from quote total calculation

In `src/pages/quote/QuoteSummaryPage.tsx`, line 276:

```
// BEFORE:
financingFee: DEALERPLAN_FEE,

// AFTER:
financingFee: 0,
```

The monthly payment calculations on lines 341, 358, 470 already separately add `DEALERPLAN_FEE` for financing — those stay as-is.

### 3. AdminQuoteControls — same fix

In `src/components/admin/AdminQuoteControls.tsx`, line 108:

```
// BEFORE:
const totalBeforeDiscount = subtotal + hst + DEALERPLAN_FEE;

// AFTER:
const totalBeforeDiscount = subtotal + hst;
```

### What stays the same (no changes)
- Monthly payment calculations — still include $299 (correct, it's a financing cost)
- Financing application URLs — still include $299 (correct)
- PDF financing sections — still include $299
- Package card monthly estimates — still include $299

### Result
- Quote total = actual purchase price (no hidden fee)
- SMS amount = matches share link = matches PDF
- Financing payments still factor in the $299 behind the scenes (per existing policy)

