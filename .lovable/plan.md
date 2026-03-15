

# Align Promotion Discount Placement: Summary Page vs PDF

## Issue

The $500 rebate appears in different locations:

- **PDF**: Shows between "Your Discount" and "Motor Price" — rebate is deducted before showing the motor subtotal ($16,820)
- **Summary page**: Shows in a separate "Your Savings" section below accessories, alongside trade-in — motor price shows as $17,320 (without rebate)

The final total calculates the same either way, but the presentation is inconsistent and the PDF approach is clearer for customers (rebate reduces the motor price directly).

## Fix

### `src/components/quote-builder/PricingTable.tsx`

Move the promotional savings line item from the "Your Savings" section (lines 147-163) up into the motor pricing section (after discount, before Motor Price on line 101-105). Update the Motor Price calculation on line 103 to subtract `pricing.promoValue` as well, so it matches the PDF's `motorSubtotal`.

The "Your Savings" section will then only contain trade-in value. If there's no trade-in, the section won't render.

**Before:**
```
MSRP                    $19,680
Your Discount          -$2,360
Motor Price            $17,320
── Accessories ──
── Your Savings ──
  Trade Value          -$3,875
  7-Yr + $500 Rebate     -$500
Subtotal               $13,295
```

**After (matches PDF):**
```
MSRP                    $19,680
Your Discount          -$2,360
7-Yr + $500 Rebate       -$500
Motor Price            $16,820
── Accessories ──
── Your Savings ──
  Trade Value          -$3,875
Subtotal               $13,295
```

### One file changed
- `src/components/quote-builder/PricingTable.tsx` — move promo line item up, adjust Motor Price subtotal formula

