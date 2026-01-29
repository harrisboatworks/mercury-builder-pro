

# Make Voice Agent's Promo Knowledge Fully Dynamic

## Problem

The voice agent has **hardcoded references** to the current "Get 7" promo structure that won't adapt when you add a new promotion:

| Issue | Current Code | Problem |
|-------|-------------|---------|
| Line 127 | `(total 7 years!)` | Hardcoded "7" won't update for future promos |
| Lines 170-180 | Static "HOW TO EXPLAIN" guide | References specific option names that may not exist in future promos |

---

## Solution

Make the promotion formatting fully dynamic by:

1. **Calculate total warranty dynamically** (base 3 + promo bonus)
2. **Generate the "how to explain" guide from the promo options data** instead of hardcoding option names
3. **Add fallback guidance** when no promo options exist

---

## Technical Changes

### File: `supabase/functions/elevenlabs-conversation-token/index.ts`

#### 1. Fix Warranty Display (Line 126-128)

**Before:**
```typescript
if (promo.warranty_extra_years) {
  formatted += `- Extra Warranty: ${promo.warranty_extra_years} additional years of coverage (total 7 years!)\n`;
}
```

**After:**
```typescript
if (promo.warranty_extra_years) {
  const baseWarranty = 3; // Mercury standard
  const totalYears = baseWarranty + promo.warranty_extra_years;
  formatted += `- Extra Warranty: ${promo.warranty_extra_years} additional years FREE (${totalYears} years total!)\n`;
}
```

#### 2. Generate Dynamic "How to Explain" Guide (Lines 170-180)

Instead of hardcoded option names, generate the guide from the promo data:

**Before:**
```typescript
formatted += `
**HOW TO EXPLAIN THE CHOOSE ONE OPTIONS:**
1. "6 Months No Payments" - Great for customers who want...
2. "Special Financing" - Best for customers financing...
3. "Factory Cash Rebate" - Instant money off...
`;
```

**After:**
```typescript
// Only add explanation guide if there were promo options
if (hasChooseOneOptions) {
  formatted += `
**HOW TO HELP CUSTOMERS CHOOSE:**
When customer asks "which option should I choose?" → Ask about their situation:
- Want to defer payments? → No-payment options work best
- Financing a large amount? → Lower interest rates save money over time
- Paying mostly cash? → Rebates give instant savings

Use the specific option details listed above to explain what's available.
`;
}
```

#### 3. Track If Promo Has Options

Add a flag to track whether any promo had "choose one" options so we only show the guide when relevant:

```typescript
let hasChooseOneOptions = false;

promotions.forEach(promo => {
  // ... existing code ...
  
  const promoOptions = promo.promo_options?.options;
  if (promoOptions && Array.isArray(promoOptions) && promoOptions.length > 0) {
    hasChooseOneOptions = true;
    // ... rest of options formatting
  }
});

// After the loop, conditionally add guidance
if (hasChooseOneOptions) {
  formatted += `... dynamic guidance ...`;
}
```

---

## What This Fixes

| Scenario | Before | After |
|----------|--------|-------|
| New promo with 5-year bonus | Says "total 7 years" (wrong) | Says "8 years total" (correct) |
| Promo with different options | References wrong option names | Uses actual option titles from database |
| Promo with no choose-one | Shows irrelevant guidance | Shows no guidance (appropriate) |

---

## Edge Function Deployment

After the fix, the `elevenlabs-conversation-token` edge function will need to be redeployed.

