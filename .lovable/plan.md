

# Fix: Selected Options Missing from Sticky Quote Bars

## Problem
When selecting optional add-ons (like the 25 L fuel tank) on Step 2 "Customize Your Motor Package", the price is not reflected in the bottom sticky bar. However, the final Summary, PDF, and Financing application DO include these options correctly.

## Verified Status

| Component | Selected Options | Status |
|-----------|-----------------|--------|
| Quote Summary Page | ✅ Included | Uses `selectedOptionsTotal` in pricing |
| PDF Quote | ✅ Included | Receives `accessoryBreakdown` with options |
| Financing Application | ✅ Included | Gets total price with options |
| Desktop Sticky Bar | ❌ Missing | Needs fix |
| Mobile Sticky Bar | ❌ Missing | Needs fix |
| Mobile Breakdown Drawer | ❌ Missing | Needs fix |

## Solution

Add `state.selectedOptions` to the running total calculation in all three components.

---

## Files to Modify

### 1. GlobalStickyQuoteBar.tsx (Desktop)

Add selected options total after motor price:

```typescript
// After line 50: let total = state.motor.price;
const selectedOptionsTotal = (state.selectedOptions || []).reduce(
  (sum, opt) => sum + opt.price, 0
);
total += selectedOptionsTotal;
```

Update dependency array to include `state.selectedOptions`.

---

### 2. UnifiedMobileBar.tsx (Mobile Bar)

Add selected options inside the `if (!isPreview)` block:

```typescript
// After line 418 (fuel tank config)
const selectedOptionsTotal = (state.selectedOptions || []).reduce(
  (sum, opt) => sum + opt.price, 0
);
total += selectedOptionsTotal;
```

Update dependency array to include `state.selectedOptions`.

---

### 3. MobileQuoteDrawer.tsx (Mobile Breakdown)

Add selected options as line items after "Motor Price":

```typescript
// After line 53 (Motor Price line item)
if (state.selectedOptions && state.selectedOptions.length > 0) {
  state.selectedOptions.forEach(option => {
    if (option.price > 0) {
      subtotal += option.price;
      lineItems.push({ label: option.name, value: option.price });
    }
  });
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/quote/GlobalStickyQuoteBar.tsx` | Add `selectedOptionsTotal` to `runningTotal` calculation |
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Add `selectedOptionsTotal` to `runningTotal` calculation |
| `src/components/quote-builder/MobileQuoteDrawer.tsx` | Add selected options as line items in pricing breakdown |

## Result

After this fix, when a customer selects a fuel tank or any add-on on the Options page:
- Desktop sticky bar shows updated total immediately
- Mobile sticky bar shows updated total immediately  
- Mobile drawer shows each option as a line item with price
- Summary, PDF, and Financing continue to work as before (already correct)

