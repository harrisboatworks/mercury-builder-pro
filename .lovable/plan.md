
# Fix: Decimal Horsepower Input for Trade-In

## Problem
When entering horsepower for a trade-in motor, users cannot input decimal values like "9.9". The input truncates to "9" because:
1. `parseInt()` is used instead of `parseFloat()`
2. The number input defaults to `step="1"`, blocking decimal entry

## Solution
Update the horsepower input in `TradeInValuation.tsx`:

### File Changes

**`src/components/quote-builder/TradeInValuation.tsx`** (line 325-332)

| Change | From | To |
|--------|------|-----|
| Parser function | `parseInt(e.target.value)` | `parseFloat(e.target.value)` |
| Step attribute | (none) | `step="0.1"` |
| Placeholder | `"e.g., 115"` | `"e.g., 9.9 or 115"` |

**Updated code:**
```tsx
<Input
  id="trade-hp"
  type="number"
  value={tradeInInfo.horsepower || ''}
  onChange={(e) => onTradeInChange({ 
    ...tradeInInfo, 
    horsepower: parseFloat(e.target.value) || 0 
  })}
  placeholder="e.g., 9.9 or 115"
  min="1"
  max="600"
  step="0.1"
  className={`min-h-[48px] rounded-sm font-light ${
    showValidation && missingFields.horsepower 
      ? 'border-red-500 ring-1 ring-red-500' 
      : 'border-gray-300'
  }`}
/>
```

## Technical Notes
- The `TradeInInfo.horsepower` field is already typed as `number`, which supports decimals
- Using `step="0.1"` allows common fractional HP values (9.9, 2.5, etc.)
- The valuation engine in `trade-valuation.ts` already handles decimal HP values correctly

## Impact
- Users can now enter 9.9 HP, 2.5 HP, and other fractional horsepower values
- No changes needed to the trade-in valuation logic or database schema
