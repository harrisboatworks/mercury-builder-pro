

# Update Quote Summary Footer & Add Savings Section Divider

## Overview

Two improvements to the PricingTable component:
1. Replace confusing "Installation and PDI included" text with clearer messaging about inspection requirements
2. Add a subtle "Your Savings" section divider to visually group discount line items together

---

## Changes

### 1. Update Footer Note Text

**Current (line 198):**
```
All prices in Canadian dollars. Installation and PDI included.
*Estimated trade value subject to physical inspection.
```

**Updated:**
```
All prices in Canadian dollars. Installation, rigging, and trade-in values subject to inspection and verification.
```

This change:
- Removes confusing industry jargon ("PDI")
- Consolidates the trade-in disclaimer into the main note
- Makes clear that multiple items require verification

---

### 2. Add "Your Savings" Section Divider

Group the discount line items (trade-in, promos) under a subtle header to visually separate them from the motor pricing while keeping individual line item transparency.

**New section structure (between accessories and subtotal):**

```
┌─────────────────────────────────────────┐
│  Motor Price                    $X,XXX  │
├─────────────────────────────────────────┤
│  Accessories & Setup                    │
│  ├─ Battery                      $XXX   │
│  └─ Installation                 $XXX   │
├─────────────────────────────────────────┤
│  💰 Your Savings                        │  ← New subtle header
│  ├─ Trade Value (2020 Merc 75HP) −$X,XXX│
│  └─ Mercury GET 7 Promotion      −$XXX  │
├─────────────────────────────────────────┤
│  Subtotal                       $X,XXX  │
│  HST (13%)                        $XXX  │
│  Total Price                    $X,XXX  │
└─────────────────────────────────────────┘
```

**Implementation:**

```tsx
{/* Your Savings Section - only show if there are savings */}
{(tradeInValue > 0 || pricing.promoValue > 0) && (
  <div className="space-y-1 pt-3">
    <div className="flex items-center gap-2 py-1 border-t border-dashed border-emerald-200">
      <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
        Your Savings
      </span>
    </div>
    
    {/* Trade Value */}
    {tradeInValue > 0 && (
      <LineItemRow
        label={formatTradeInLabel(tradeInInfo)}
        amount={tradeInValue}
        isDiscount
        className="pl-2 border-l-2 border-emerald-200"
      />
    )}
    
    {/* Promotional Savings */}
    {pricing.promoValue > 0 && (
      <LineItemRow
        label={/* existing promo label logic */}
        amount={pricing.promoValue}
        isDiscount
        description="Mercury GET 7 Promotion"
        className="pl-2 border-l-2 border-emerald-200"
      />
    )}
  </div>
)}
```

---

## File to Modify

| File | Changes |
|------|---------|
| `src/components/quote-builder/PricingTable.tsx` | 1. Add "Your Savings" section wrapper with subtle header<br>2. Move trade-in and promo rows inside the savings section<br>3. Update footer note text |

---

## Visual Result

**Before:**
- Discounts scattered between accessories and subtotal
- Generic footer text with jargon

**After:**
- Clean "Your Savings" section with dashed green border
- All discount items grouped with left accent border
- Professional footer with clear inspection disclaimer

---

## Design Rationale

- **Emerald/green accents**: Already used for discount styling (LineItemRow uses `text-emerald-600`), so this maintains visual consistency
- **Dashed border**: Subtle separation without heavy visual weight
- **"Your Savings" label**: Customer-focused language that feels like a win
- **Individual line items preserved**: Transparency on exactly where savings come from
- **Uppercase tracking**: Premium typography treatment for section headers

