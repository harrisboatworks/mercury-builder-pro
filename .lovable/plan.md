

# Simplify Trade-In Form to Reduce Abandonment

## Changes

### 1. Make "Skip" the visually dominant default
- Swap card order: "No trade-in" first (left on desktop, top on mobile)
- Add subtle hint: "Most customers skip this step"
- Replace AlertTriangle icon with ArrowRight

### 2. Collapse optional fields (except Engine Type)
- Keep visible: Brand, Year, HP, Condition, **Engine Type** (5 fields)
- Collapse behind "Add more details for a better estimate": Start Type, Model, Engine Hours, Serial Number

### 3. Auto-estimate when required fields are filled
- Remove manual "Get Trade-In Estimate" button
- Auto-trigger estimate when brand + year + HP + condition are all filled (same loading animation)

### 4. Pre-select "Good" condition visually
- Ensure the default `'good'` value renders as selected on load

## What Does NOT Change
- Valuation algorithm, data structure, pre-fill logic, audit fields — all untouched

## Files

| File | Change |
|------|--------|
| `src/components/quote-builder/TradeInValuation.tsx` | Reorder cards, collapse 4 optional fields (keep engine type visible), auto-estimate, swap icon |

