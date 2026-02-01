
# Move Trade-In Motor Description to Second Line

## Problem

Currently, the trade-in label shows everything on one line:
```
Estimated Trade Value (2020 Yamaha 20 HP)    −$2,400
```

On mobile, this wraps awkwardly mid-text. The user wants the motor description on its own line for cleaner formatting.

## Solution

Use the existing `description` prop on `LineItemRow` to put the motor details on a dedicated second line:

```
Estimated Trade Value                        −$2,400
2020 Yamaha 20 HP
```

## Changes

**File:** `src/components/quote-builder/PricingTable.tsx`

### 1. Simplify the label function

```tsx
function formatTradeInLabel(): string {
  return "Estimated Trade Value";
}
```

### 2. Add a new description helper

```tsx
function formatTradeInDescription(tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string }): string | undefined {
  if (!tradeInInfo) return undefined;
  
  const { brand, year, horsepower, model } = tradeInInfo;
  const parts = [year.toString(), brand, `${horsepower} HP`];
  if (model) parts.push(model);
  
  return parts.join(' ');
}
```

### 3. Update the LineItemRow usage

```tsx
<LineItemRow
  label="Estimated Trade Value"
  amount={tradeInValue}
  isDiscount
  description={formatTradeInDescription(tradeInInfo)}
  className="pl-2 border-l-2 border-emerald-200"
/>
```

## Result

| Before | After |
|--------|-------|
| `Estimated Trade Value (2020 Yamaha 20 HP)` wrapping awkwardly | Clean two-line layout |
| Motor info gets cut off mid-phrase | Motor info on its own line |

## Visual

```
┌────────────────────────────────────────┐
│  YOUR SAVINGS                          │
│  ├─ Estimated Trade Value    −$2,400   │
│  │   2020 Yamaha 20 HP                 │
│  └─ 7 Years Warranty + $250   −$250    │
│      Mercury GET 7 Promotion           │
└────────────────────────────────────────┘
```
