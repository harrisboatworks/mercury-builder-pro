

# Add Savings Highlight for "Use Existing" Propeller

## What This Does

When the "Propeller — Use Existing" line item appears in the pricing breakdown, add a small inline savings note beneath it (similar to the existing trade-in tax savings callout) so the customer sees they're saving $350+. No extra vertical space — just a one-line green text hint appended to the existing description.

## Approach

The cleanest way is to enhance the description text in `build-accessory-breakdown.ts` itself, adding the savings amount. This flows to both the web summary AND the PDF with zero extra components.

### `src/lib/build-accessory-breakdown.ts`

In the Mercury trade-match propeller block (line 164-168), update the description to include the savings amount:

```typescript
name: 'Propeller — Use Existing',
price: 0,
description: `Your current Mercury propeller should be compatible — we'll confirm during water testing (additional charge applies if needed). Saving you $${propAllowance.price.toLocaleString()}.`
```

This uses the already-available `propAllowance.price` ($350 or $1,200 depending on HP) so the savings figure is always accurate.

### `src/components/quote-builder/PricingTable.tsx`

In the accessory breakdown loop (line 114-122), detect "Use Existing" items and render them with a green highlight style instead of the default — add `text-emerald-600` to the label and a small "✓ Saving $X" badge inline. This keeps the same row height, just colors it differently:

```tsx
const isExistingProp = item.name.includes('Use Existing');
<LineItemRow
  key={index}
  label={item.name}
  amount={item.price}
  description={item.description}
  className={cn("pl-4 border-l-2", isExistingProp ? "border-emerald-300 bg-emerald-50/50" : "border-muted")}
/>
```

## Files

| File | Change |
|------|--------|
| `src/lib/build-accessory-breakdown.ts` | Add savings amount to description text |
| `src/components/quote-builder/PricingTable.tsx` | Green highlight styling for "Use Existing" prop row |

