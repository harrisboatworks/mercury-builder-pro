

# Fix Trade-In Valuation for Older Motors

## Problem Identified

The console logs reveal two issues:

1. **Data Entry Issue:** The horsepower was recorded as `2` instead of `25` (UI shows "25 ELPT" in the model field, but HP field only captured `2`)

2. **Underlying Valuation Issue:** The formula for motors older than 2015 uses only **$25/HP** which is too low. A 2005 Mercury 25HP in good condition calculates to ~$500, but should realistically be **$1,000-$1,500**

---

## Current Formula (Motors Pre-2015)

```
baseValue = horsepower × $25
estimatedValue = baseValue × conditionMultiplier (0.8 for "Good")
```

**Example: 2005 Mercury 25HP Good**
- Current: $625 × 0.8 = $500 (range $400-$600)
- Should be: ~$1,200-$1,500

---

## Proposed Fix: Add 2010-2014 and 2005-2009 Year Ranges

Rather than using a generic formula for all motors pre-2015, add detailed pricing data for older year ranges:

| Year Range | Mercury 25HP Good Value |
|------------|-------------------------|
| 2020-2024 | $2,600 |
| 2015-2019 | $2,200 |
| 2010-2014 | **$1,800** (new) |
| 2005-2009 | **$1,400** (new) |
| Pre-2005 | Generic formula (improved) |

---

## Technical Changes

### 1. Add Year Ranges to `tradeValues` Database

**File: `src/lib/trade-valuation.ts`**

Add two new year ranges for each brand with appropriately depreciated values:

```typescript
'2010-2014': {
  '5': { excellent: 600, good: 475, fair: 375, poor: 225 },
  '10': { excellent: 1050, good: 825, fair: 650, poor: 400 },
  '15': { excellent: 1500, good: 1175, fair: 925, poor: 575 },
  '20': { excellent: 1950, good: 1525, fair: 1200, poor: 750 },
  '25': { excellent: 2450, good: 1900, fair: 1500, poor: 900 },
  // ... (all HP values)
},
'2005-2009': {
  '5': { excellent: 500, good: 400, fair: 300, poor: 180 },
  '10': { excellent: 900, good: 700, fair: 550, poor: 325 },
  '15': { excellent: 1300, good: 1000, fair: 800, poor: 475 },
  '20': { excellent: 1700, good: 1300, fair: 1025, poor: 625 },
  '25': { excellent: 2100, good: 1650, fair: 1300, poor: 775 },
  // ... (all HP values)
}
```

### 2. Update Year Range Detection Logic

```typescript
let yearRange = '';
if (year >= 2020) {
  yearRange = '2020-2024';
} else if (year >= 2015) {
  yearRange = '2015-2019';
} else if (year >= 2010) {
  yearRange = '2010-2014';  // NEW
} else if (year >= 2005) {
  yearRange = '2005-2009';  // NEW
} else {
  // Very old motor (pre-2005) - improved generic formula
}
```

### 3. Improve Pre-2005 Generic Formula

Increase the base multiplier from $25/HP to **$40/HP** with better age-based depreciation:

```typescript
// Motors older than 2005
const motorAge = currentYear - year;
const baseValue = horsepower * 40;  // Increased from $25
const ageDepreciation = Math.max(0.35, 1 - (motorAge - 20) * 0.03);  // Slower decline
```

---

## Expected Results After Fix

| Motor | Current Value | New Value |
|-------|---------------|-----------|
| 2005 Mercury 25HP Good | ~$500 | **$1,650** |
| 2008 Mercury 25HP Good | ~$500 | **$1,650** |
| 2012 Mercury 25HP Good | ~$500 | **$1,900** |
| 2000 Mercury 25HP Good | ~$400 | **$800** |

---

## Files to Modify

1. **`src/lib/trade-valuation.ts`**
   - Add `2010-2014` year range data for all brands
   - Add `2005-2009` year range data for all brands
   - Update year range detection logic
   - Improve pre-2005 generic formula

