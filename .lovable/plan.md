

# Use Median Selling Price (Not Minimum) for Trade-In Anchor

## The Change

Switch the MSRP aggregation from minimum to median per HP class. This bumps the 9.9HP anchor from ~$3,548 (cheapest model) to ~$4,065 (median dealer price), producing trade values closer to what Mr. Locke was originally quoted.

For the 2015 Mercury 9.9HP in excellent condition (8-12yr bracket, 29%):
- Minimum anchor ($3,548) → ~$1,050
- Median anchor (~$4,065) → ~$1,275

## File: `src/hooks/useTradeValuationData.ts`

Replace the minimum calculation (line 73-77) with a median:

```typescript
// Use median selling price per HP class
for (const [hpStr, msrps] of Object.entries(msrpsByHp)) {
  const sorted = [...msrps].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  referenceMsrps[Number(hpStr)] = sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}
```

Update the comment on line 56 to reflect "median" instead of "minimum".

One file, ~5 lines changed.

