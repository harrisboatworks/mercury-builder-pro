

# Fix Misleading Savings Labels

Two label fixes to align with the updated savings definition (savings = discounts + promos only, not trade-in).

## Changes

### 1. `src/components/quote-builder/QuoteRevealCinematic.tsx` (line 615)
Change `'Savings + Trade-In'` to `'Total Savings'` — the value shown already excludes trade-in, so the label is misleading.

```ts
// Before
{tradeInValue && tradeInValue > 0 ? 'Savings + Trade-In' : 'Total Savings'}
// After
'Total Savings'
```

### 2. `src/components/quote-builder/PricingTable.tsx` (lines 144-151)
Rename the "Your Savings" section header to "Trade-In Credit" since this section only contains the trade-in line item, which is not a "saving" per the updated definition.

```tsx
// Before
<span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
  Your Savings
</span>

// After
<span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
  Trade-In Credit
</span>
```

Two lines changed total. No logic changes needed.

