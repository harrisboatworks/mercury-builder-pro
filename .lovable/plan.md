
# Update Propeller Placeholder Prices

## Overview
Update the propeller allowance prices to reflect real Mercury pricing, making quotes more accurate for 150HP+ motors where stainless steel props are standard.

---

## Current vs Proposed Pricing

| HP Range | Current | Proposed | Reasoning |
|----------|---------|----------|-----------|
| Under 25 HP | $0 | $0 | Props included with motor |
| 25-115 HP | $350 (Aluminum) | $350 (Aluminum) | Accurate - Black Max/Spitfire range $280-$395 |
| 150 HP+ | $950 (Stainless) | $1,200 (Stainless) | More accurate - Enertia/Revolution range $1,100-$1,700 |

The $350 aluminum placeholder is already well-calibrated. The stainless placeholder at $950 is below actual market rates and should increase to $1,200 as a conservative mid-range estimate.

---

## Files to Update

### 1. BoatInformation.tsx (line 997)
The cost note shown when customer doesn't have their own prop.

**Change from:**
```
+${hp >= 150 ? '950 (Stainless Steel)' : '350 (Aluminum)'}
```

**Change to:**
```
+${hp >= 150 ? '1,200 (Stainless Steel)' : '350 (Aluminum)'}
```

### 2. MotorSelection.tsx (line 2033)
The "Total Investment Estimate" calculation in the quick view overlay.

**Change from:**
```javascript
const propCost = hp >= 25 ? hp >= 150 ? 950 : 350 : 0;
```

**Change to:**
```javascript
const propCost = hp >= 25 ? hp >= 150 ? 1200 : 350 : 0;
```

---

## Optional: Seed Data Cleanup

The file `api/quotes-seed.js` has a hardcoded "Stainless Prop" at $350 (line 78), which appears incorrect even for aluminum. This is seed/test data and doesn't affect production quotes, but could be updated for consistency if desired.

---

## No Other Changes Needed

- The pricing utilities (`quote-utils.ts`) don't hardcode prop values - they receive them from components
- The chatbot already correctly explains that final prop selection happens during water testing
- The "hasCompatibleProp" checkbox remains unchanged - customers with their own prop still get credit

---

## Summary

Two simple number changes:
1. `BoatInformation.tsx`: 950 → 1,200
2. `MotorSelection.tsx`: 950 → 1200

This brings the 150HP+ stainless steel placeholder in line with actual Mercury Enertia/Revolution pricing from your reference document.
