

# Plan: Remove Duplicate Battery Prompt + Add Propeller Opt-Out

## Issue 1: Battery asked twice

The battery question appears in two places:
- **BoatInformation.tsx** (line 928-939): "I have a marine battery" checkbox in the "What do you already have?" section
- **OptionsPage.tsx** (line 327-336): `BatteryOptionPrompt` component with proper UX cards

The OptionsPage version is the better UX and is already wired into `QuoteContext` via `SET_LOOSE_MOTOR_BATTERY`. The BoatInformation version sets `boatInfo.hasBattery` but that field is **never consumed** by the pricing engine.

**Fix**: Remove the battery checkbox block from `BoatInformation.tsx` (lines 928-940). Keep the OptionsPage version as the single source of truth.

## Issue 2: Propeller opt-out for customer's own prop

Currently `hasCompatibleProp` exists on `boatInfo` in BoatInformation but is **never used** by `buildAccessoryBreakdown` or `useQuoteRunningTotal` — the propeller allowance is always added regardless.

### Frontend changes

**A. `src/lib/build-accessory-breakdown.ts`** — When `boatInfo.hasCompatibleProp === true`, replace the propeller allowance line item with a $0 note:

```
// Instead of adding $350/$1,200 propeller allowance:
name: "Use of Customer Propeller"
price: 0
description: "If one is required, additional cost applies"
```

**B. `src/hooks/useQuoteRunningTotal.ts`** — Pass `hasCompatibleProp` through and skip adding propeller cost when true (this hook mirrors the breakdown logic).

**C. `src/components/quote-builder/BoatInformation.tsx`** — The existing `hasCompatibleProp` checkbox (line 941-953) already handles the UI. No changes needed there.

### Agent API changes

**D. `supabase/functions/agent-quote-api/index.ts`**:

- Accept a new optional field `customer_has_prop: true` on `create_quote` and `update_quote`.
- When true, skip the propeller allowance cost in `buildAgentAccessoryBreakdown` and `calcPricing`, and add a $0 line item: "Use of Customer Propeller — If one is required, additional cost applies".
- Store `hasCompatibleProp: true` in `quoteData.boatInfo` so the frontend picks it up on restore.

### Summary of file changes

| File | Change |
|------|--------|
| `BoatInformation.tsx` | Remove battery checkbox (lines 928-940) |
| `build-accessory-breakdown.ts` | Check `boatInfo.hasCompatibleProp`; if true, show $0 "Use of Customer Propeller" instead of allowance |
| `useQuoteRunningTotal.ts` | Pass `hasCompatibleProp` and skip propeller cost when true |
| `agent-quote-api/index.ts` | Accept `customer_has_prop`, skip prop cost, store in quoteData |

