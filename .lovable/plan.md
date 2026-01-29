
# Remove Green "In Stock" Badges from Motor Cards

## Summary

Remove the green "In Stock" badges that appear in the top-left corner of motor cards. The stock information is already displayed in the card text (e.g., "🟢 5 in stock today"), making the badge redundant and visually cluttered.

---

## Changes

| File | Change |
|------|--------|
| `src/components/motors/MotorCardPremium.tsx` | Remove `StockBadge` component from the image overlay |
| `src/components/motors/MotorCardPreview.tsx` | Remove `StockBadge` component from the image overlay |
| `src/components/motors/HPMotorCard.tsx` | Remove `StockBadge` component from the image overlay |

---

## What Will Be Removed

### From MotorCardPremium.tsx (lines 246-253)
```typescript
// REMOVE THIS:
<StockBadge 
  motor={{
    in_stock: inStock,
    stock_quantity: motor?.stockQuantity,
    stock_number: motor?.stockNumber
  }}
  variant="default"
/>
```

### From MotorCardPreview.tsx (lines 439-446)
```typescript
// REMOVE THIS:
<StockBadge 
  motor={{
    in_stock: inStock,
    stock_quantity: motor?.stockQuantity,
    stock_number: motor?.stockNumber
  }}
  variant="default"
/>
```

### From HPMotorCard.tsx (lines 113-120)
```typescript
// REMOVE THIS:
{inStockCount > 0 && (
  <div className="absolute top-4 left-4">
    <StockBadge 
      motor={{ in_stock: true, stock_quantity: inStockCount }}
      variant="default"
    />
  </div>
)}
```

---

## What Stays

The text-based stock status at the bottom of each card will remain:
- **HPMotorCard**: "🟢 5 in stock today" or "○ Available to order"
- **MotorCardPremium/Preview**: Similar stock text in the content area

This keeps the stock information visible without the visual clutter of the badge overlay.
