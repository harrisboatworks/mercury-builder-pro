
# Show "Special Price" Badge for Manually-Priced Motors

## ✅ COMPLETED

When you manually set a special price on a motor through the admin panel, the card will display a **"Special Price"** badge instead of the rule-based "Best Seller" badge.

---

## Implementation Summary

| File | Change |
|------|--------|
| `src/components/motors/PopularityBadge.tsx` | ✅ Added `'special-price'` type with red promo gradient styling |
| `src/lib/motor-helpers.ts` | ✅ Added `hasManualSalePrice?: boolean` to Motor interface |
| `src/pages/quote/MotorSelectionPage.tsx` | ✅ Set `hasManualSalePrice` flag when `manualOverrides.sale_price` is present and not expired |
| `src/components/motors/MotorCardPremium.tsx` | ✅ Prioritize special-price badge over popularity |
| `src/components/motors/MotorCardPreview.tsx` | ✅ Prioritize special-price badge over popularity |

---

## Badge Visual

| Badge Type | Color | Icon |
|------------|-------|------|
| Best Seller | Gold gradient | Star |
| Popular | Dark gray | Star |
| Dealer's Pick | Gold gradient | Award |
| **Special Price** | Red/promo gradient | Tag |
