

# Polish Quote Summary - Final Refinements

## Overview

Five targeted improvements to polish the pricing breakdown UX:

1. Unify MSRP row styling with LineItemRow
2. Shorten promo labels with details in description
3. Add subtle green highlight to total savings callout
4. Change "Dealer Discount" to "Your Discount"
5. Remove motor name redundancy from MSRP line

---

## Changes

### 1. Unify MSRP Row Styling

**Current (lines 73-81):**
```tsx
<div className="flex items-baseline justify-between">
  <div className="text-muted-foreground">
    MSRP - {motorName}
  </div>
  <div className="text-right">
    <s className="text-muted-foreground">${pricing.msrp.toLocaleString()}</s>
  </div>
</div>
```

**Updated:**
Use a simpler "MSRP" label since the motor name is already shown in the header above. Keep the strikethrough styling.

```tsx
<div className="flex items-baseline justify-between py-2">
  <div className="text-sm text-muted-foreground">MSRP</div>
  <div className="text-right">
    <s className="text-muted-foreground">${pricing.msrp.toLocaleString()}</s>
  </div>
</div>
```

---

### 2. Shorten Promo Labels

**Current (lines 148-157):**
```tsx
label={
  selectedPromoOption === 'no_payments' 
    ? '7 Years Warranty + 6 Mo No Payments'
    : selectedPromoOption === 'special_financing'
    ? `7 Years Warranty + ${selectedPromoValue || '2.99%'} APR`
    : selectedPromoOption === 'cash_rebate'
    ? `7 Years Warranty + ${selectedPromoValue} Rebate`
    : 'Promotional Savings'
}
```

**Updated:**
Shorter labels, move promo name to description:

```tsx
label={
  selectedPromoOption === 'no_payments' 
    ? '7-Year Warranty + No Payments'
    : selectedPromoOption === 'special_financing'
    ? `7-Year Warranty + ${selectedPromoValue || '2.99%'} APR`
    : selectedPromoOption === 'cash_rebate'
    ? `7-Year Warranty + ${selectedPromoValue} Rebate`
    : 'Promotional Savings'
}
description="Mercury GET 7 Promotion"
```

---

### 3. Highlight Total Savings Callout

**Current (lines 199-201):**
```tsx
<span className="block mt-1 text-green-600 font-medium">
  Total savings of ${pricing.savings.toLocaleString()} vs MSRP
</span>
```

**Updated:**
Add subtle green background pill for more visual prominence:

```tsx
<span className="inline-block mt-2 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-semibold">
  Total savings of ${pricing.savings.toLocaleString()} vs MSRP
</span>
```

---

### 4. Personalize Dealer Discount Label

**Current (line 86):**
```tsx
label="Dealer Discount"
```

**Updated:**
```tsx
label="Your Discount"
```

---

### 5. Remove Redundant Motor Name from MSRP

The motor name already appears in the header section (lines 58-61). Showing it again in "MSRP - Mercury 150HP FourStroke" is redundant.

**Current:** `MSRP - {motorName}`
**Updated:** `MSRP`

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/quote-builder/PricingTable.tsx` | All 5 refinements above |

---

## Visual Result

```
┌─────────────────────────────────────────┐
│  Pricing Breakdown                      │
│  Mercury 150HP FourStroke               │
│  Complete cost breakdown for your quote │
├─────────────────────────────────────────┤
│  MSRP                          $12,999  │  ← Cleaner, no redundant name
│  Your Discount                 −$1,500  │  ← Personalized
│  Special Discount                −$200  │
│  Motor Price                   $11,299  │
├─────────────────────────────────────────┤
│  YOUR SAVINGS                           │
│  ├─ Estimated Trade Value      −$2,400  │
│  │   2020 Yamaha 20 HP                  │
│  └─ 7-Year Warranty + $250     −$250    │  ← Shorter label
│      Mercury GET 7 Promotion            │
├─────────────────────────────────────────┤
│  Subtotal                      $8,649   │
│  HST (13%)                     $1,124   │
│  Total Price                   $9,773   │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐   │
│  │ Total savings of $3,226 vs MSRP │   │  ← Green pill highlight
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

