
# Show "Special Price" Badge for Manually-Priced Motors

## Summary

When you manually set a special price on a motor through the admin panel, the card will display a **"Special Price"** badge instead of the rule-based "Best Seller" badge. This ensures customers clearly see which motors have dealer-specific pricing.

---

## How It Will Work

Motors with a manually-entered sale price (via admin overrides) will show the "Special Price" badge with priority over the auto-detected popularity badges. If no manual price is set, the normal "Best Seller" / "Popular" / "Dealer's Pick" logic will apply as usual.

---

## Technical Changes

### 1. Add `special-price` Badge Type to PopularityBadge Component

**File:** `src/components/motors/PopularityBadge.tsx`

- Add new type: `'special-price'` to the `PopularityType` union
- Add badge configuration with a distinctive red/promo style (using the existing promo color tokens)
- Use a "DollarSign" or "Tag" icon to indicate it's about pricing

### 2. Track Manual Sale Price on Motor Object

**File:** `src/pages/quote/MotorSelectionPage.tsx`

- Add a new flag `hasManualSalePrice: boolean` to the converted motor object
- This flag is `true` when `manualOverrides.sale_price` is set and not expired

### 3. Update Motor Type Definition

**File:** `src/lib/motor-helpers.ts`

- Add `hasManualSalePrice?: boolean` to the `Motor` interface

### 4. Update Badge Logic in Motor Cards

**Files:** 
- `src/components/motors/MotorCardPremium.tsx`
- `src/components/motors/MotorCardPreview.tsx`

- Check `motor.hasManualSalePrice` first
- If true, show `PopularityBadge type="special-price"` 
- Otherwise, fall back to the existing `getMotorPopularity()` logic

---

## Visual Design

The "Special Price" badge will use a **red/promo gradient** style to stand out and match the existing promotional color scheme:

| Badge Type | Color | Icon |
|------------|-------|------|
| Best Seller | Gold gradient | Star |
| Popular | Dark gray | Star |
| Dealer's Pick | Gold gradient | Award |
| **Special Price** | Red/promo gradient | Tag |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/motors/PopularityBadge.tsx` | Add `'special-price'` type with red styling |
| `src/lib/motor-helpers.ts` | Add `hasManualSalePrice` to Motor interface |
| `src/pages/quote/MotorSelectionPage.tsx` | Set `hasManualSalePrice` flag when processing motors |
| `src/components/motors/MotorCardPremium.tsx` | Prioritize special-price badge over popularity |
| `src/components/motors/MotorCardPreview.tsx` | Prioritize special-price badge over popularity |
