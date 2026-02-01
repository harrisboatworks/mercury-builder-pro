
# Add "Financing Unavailable" Label for Sub-$5,000 Quotes

## Overview

Instead of just hiding the monthly payment estimate when a quote is below $5,000, show a subtle "Financing N/A" or "Cash Only" label so customers understand why there's no financing option.

## Changes

### 1. StickyQuoteBar (Desktop)

**File:** `src/components/quote/StickyQuoteBar.tsx`

Add a new prop `financingUnavailable` to indicate when the total is below the threshold, then display a muted label instead of the monthly payment.

**Props update:**
```tsx
type Props = {
  // ... existing props
  financingUnavailable?: boolean;  // New: indicates total < $5,000
};
```

**Render logic (around line 59):**
```tsx
{typeof monthly === "number" && monthly > 0 ? (
  <span>≈ {money(Math.round(monthly))}/mo<span className="hidden md:inline"> OAC</span></span>
) : financingUnavailable ? (
  <span className="text-slate-400 text-[10px] md:text-xs">Financing N/A</span>
) : null}
```

---

### 2. GlobalStickyQuoteBar (Desktop - passes prop)

**File:** `src/components/quote/GlobalStickyQuoteBar.tsx`

Add logic to detect when the total is valid but below the threshold, and pass the new `financingUnavailable` prop.

**New computed value:**
```tsx
const financingUnavailable = useMemo(() => {
  return runningTotal !== null && runningTotal > 0 && runningTotal < FINANCING_MINIMUM;
}, [runningTotal]);
```

**Pass to StickyQuoteBar:**
```tsx
<StickyQuoteBar
  // ... existing props
  financingUnavailable={financingUnavailable}
/>
```

---

### 3. UnifiedMobileBar (Mobile Bottom Bar)

**File:** `src/components/quote-builder/UnifiedMobileBar.tsx`

Add a computed flag and update the render block to show "Financing N/A" when below threshold.

**New computed value (after monthlyPayment useMemo):**
```tsx
const financingUnavailable = useMemo(() => {
  if (!runningTotal) return false;
  const priceWithHST = runningTotal * 1.13;
  return priceWithHST < FINANCING_MINIMUM;
}, [runningTotal]);
```

**Updated render (around lines 1398-1402):**
```tsx
{monthlyPayment > 0 ? (
  <span className="text-gray-500 text-[9px] min-[375px]:text-[10px]">
    ≈{money(monthlyPayment)}/mo
  </span>
) : financingUnavailable && runningTotal > 0 ? (
  <span className="text-gray-400 text-[8px] min-[375px]:text-[9px]">
    Financing N/A
  </span>
) : null}
```

---

### 4. MobileQuoteDrawer (Expandable Drawer)

**File:** `src/components/quote-builder/MobileQuoteDrawer.tsx`

The drawer always shows a financing section. Update it to show "Financing Unavailable" when below threshold.

**Add computed value in pricing useMemo:**
```tsx
return {
  // ... existing values
  financingUnavailable: total < FINANCING_MINIMUM  // Add this
};
```

**Update render (around lines 268-280):**
```tsx
{/* Financing Estimate */}
<div className="bg-muted/50 rounded-xl p-4">
  <div className="flex items-center gap-2 mb-1">
    <CreditCard className="h-4 w-4 text-primary" />
    <span className="text-sm font-medium">Monthly Financing</span>
  </div>
  {pricing.financingUnavailable ? (
    <>
      <p className="text-sm text-muted-foreground">
        Financing available for purchases $5,000+
      </p>
    </>
  ) : (
    <>
      <p className="text-2xl font-semibold">
        ≈ {money(pricing.monthly)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {pricing.termMonths} months @ {pricing.rate}% APR OAC
      </p>
    </>
  )}
</div>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote/StickyQuoteBar.tsx` | Add `financingUnavailable` prop and render "Financing N/A" label |
| `src/components/quote/GlobalStickyQuoteBar.tsx` | Compute and pass `financingUnavailable` prop |
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Add `financingUnavailable` flag and show label in mobile bar |
| `src/components/quote-builder/MobileQuoteDrawer.tsx` | Show "Financing available for purchases $5,000+" in drawer |

---

## Result

| Before | After |
|--------|-------|
| Monthly payment just disappears for small quotes | Shows "Financing N/A" label |
| Customers confused why no financing option | Clear indication that financing requires $5,000+ |
| Drawer shows $0/mo or misleading info | Shows helpful threshold message |

---

## UX Notes

- **Label choices**: "Financing N/A" is short and fits in compact bars. The drawer has more space, so it shows the full explanation.
- **Styling**: Uses muted/gray text to indicate unavailability without drawing too much attention.
- **Threshold clarity**: The drawer explicitly states "$5,000+" so customers know what's required if they want financing.
