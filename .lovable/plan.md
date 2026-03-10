

# Trade-In Value Override for Admin & Agent

## Problem
Currently, trade-in values are always calculated from the valuation formula. When the agent (or you as admin) wants to offer more for a trade-in, the only workaround is adding a custom discount — which works mathematically but shows up wrong on the quote (discount line instead of a higher trade-in value).

## Solution
Add a `trade_in_override` field that lets the agent or admin specify an exact trade-in value, bypassing the formula. The system still runs the estimate (for reference) but uses the override value in pricing.

## Changes

### 1. Agent API (`supabase/functions/agent-quote-api/index.ts`)

**In `create_quote`** (around line 516):
- After running the trade estimate, check for `body.trade_in.override_value`
- If provided, use that as `tradeInValue` instead of the formula result
- Store both the original estimate and the override in `tradeInData` so the quote shows the context:
  ```
  tradeInData.originalEstimate = formulaValue;
  tradeInData.overrideValue = body.trade_in.override_value;
  tradeInData.estimatedValue = overrideValue; // this is what pricing uses
  ```

**In `update_quote`** (around line 800):
- Same logic — if `body.trade_in.override_value` is provided, use it instead of formula

**In `estimate_trade_in`** action:
- No change needed — it just returns the estimate. The override happens at quote creation time.

### 2. Frontend — Admin Quote Detail (`src/pages/AdminQuoteDetail.tsx`)

- When displaying trade-in value, show the override indicator if `tradeInInfo.overrideValue` exists
- Show original estimate as reference text (e.g., "Formula estimate: $X,XXX — Overridden to: $Y,YYY")

### 3. Frontend — Quote Summary Page (`src/pages/quote/QuoteSummaryPage.tsx`)

- The trade-in value already reads from `state.tradeInInfo.estimatedValue`, so it will automatically pick up the override value with no code change needed
- Optionally show a small note if override was applied

### 4. Update API Documentation (`AGENT_API_INSTRUCTIONS.md`)

- Document the new `override_value` field in the `trade_in` object for `create_quote` and `update_quote`

## What the agent can then do

Instead of the workaround:
> "I'll add a custom discount of $500 to effectively increase your trade-in value"

It can now say:
> "I've increased your trade-in allowance to $10,475"

And the quote will show the correct trade-in line item at $10,475.

## No database changes needed
The override value is stored in the existing `quote_data` JSONB blob and `tradein_value_final` column.

