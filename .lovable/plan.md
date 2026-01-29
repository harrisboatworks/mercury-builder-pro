

# Fix: Battery Display on Summary + Remove Redundant Tax Text

## Issues Identified

### Issue 1: Battery Not Showing on Quote Summary
The battery selection IS being saved correctly to state when the user clicks "Continue" on the Options page. However, looking at the current code flow:

- **Line 364 in QuoteSummaryPage.tsx**: The condition `isElectricStart && state.looseMotorBattery?.wantsBattery` is correct
- **Line 407**: The dependency array includes `state.looseMotorBattery`

The logic looks correct, but the issue is likely that the motor being tested doesn't trigger `isElectricStart = true` via `hasElectricStart()`. Let me verify by checking if the model string is being passed correctly.

**Root Cause Found**: At line 210 in QuoteSummaryPage.tsx:
```typescript
const motorModel = motor?.model || '';
```

But `motor` comes from `quoteData.motor` which is resolved at line 126-135. If `motor` is undefined or the model string is empty, `hasElectricStart('')` returns `false`.

**Fix**: Add a fallback to also check `state.motor?.model` directly from the context, ensuring we always have the motor model even if `quoteData` hasn't resolved the motor object.

### Issue 2: "Ontario Tax Included" Text
Found at `PricingTable.tsx:167`:
```typescript
<LineItemRow
  label="HST (13%)"
  amount={pricing.tax}
  description="Ontario tax included"  // ← Redundant, remove this
/>
```

This is unnecessary - customers know HST is Ontario's tax.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/PricingTable.tsx` | Remove "Ontario tax included" description |
| `src/pages/quote/QuoteSummaryPage.tsx` | Add fallback for motor model to ensure `isElectricStart` works reliably |

---

## Code Changes

### 1. PricingTable.tsx - Remove Redundant Tax Description

**Line 164-168 - Current:**
```typescript
<LineItemRow
  label="HST (13%)"
  amount={pricing.tax}
  description="Ontario tax included"
/>
```

**Replace with:**
```typescript
<LineItemRow
  label="HST (13%)"
  amount={pricing.tax}
/>
```

### 2. QuoteSummaryPage.tsx - Fix Motor Model Resolution

**Line 210 - Current:**
```typescript
const motorModel = motor?.model || '';
```

**Replace with:**
```typescript
const motorModel = motor?.model || state.motor?.model || '';
```

This ensures the motor model is always available, even if the resolved `motor` object from `quoteData` doesn't have a model property for some reason.

---

## Expected Results

| Issue | Before | After |
|-------|--------|-------|
| Battery on summary | Not visible when selected | Shows "Marine Starting Battery - $179.99" line item |
| HST description | "HST (13%) - Ontario tax included" | "HST (13%)" - clean, no redundant text |

---

## Technical Details

The `hasElectricStart()` utility parses motor model codes:
- Looks for 'E' prefix (electric start) vs 'M' prefix (manual)
- Motors 40+ HP default to electric start
- Uses regex pattern matching on model strings like "9.9EH FourStroke"

By ensuring the motor model string is always populated, the electric start detection will work correctly and the battery will appear in the summary breakdown when selected.

