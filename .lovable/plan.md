
# Fix: Loose Motor Path Still Shows Installation + Missing Battery Prompt

## Problems Identified

Looking at your PDF and the code, I found **two root causes**:

### Problem 1: Installation Labor Still Appears on Loose Motor Path
The PDF shows **"Professional Installation $450.00"** even though you selected "Loose Motor". 

**Root Cause**: In `QuoteSummaryPage.tsx` (lines 331-338), the code adds installation labor for **all non-tiller motors** without checking the purchase path:

```typescript
// Professional installation for remote motors
if (!isManualTiller) {
  breakdown.push({
    name: 'Professional Installation',
    price: installationLaborCost,  // $450
    ...
  });
}
```

This condition is missing: `state.purchasePath === 'installed'`

The same issue affects:
- `PackageSelectionPage.tsx` (line 148): `installationLaborCost` is computed for all remote motors without path guard
- `GlobalStickyQuoteBar.tsx` (line 228): same unguarded calculation
- `UnifiedMobileBar.tsx`: similar issue

### Problem 2: Battery Prompt Never Appeared
Your motor (15EXLPT ProKicker) is an electric start tiller motor on the loose path, which should trigger the battery choice prompt. However, the PDF shows no battery was discussed.

**Root Cause**: In `TradeInPage.tsx` (lines 51-65), the detection logic is:

```typescript
const isElectricStart = model.includes('EH') || model.includes('EL') || 
                        model.includes('ELPT') || model.includes('EXL') || ...
```

For **"15EXLPT ProKicker"**, the code does check `ELPT` but also requires `isTiller` to be `true`. 

The `isTillerMotor()` function in `motor-helpers.ts` may not correctly identify "ProKicker" models as tillers because:
- ProKicker motors are typically tiller-style but the model code might not contain "H" (the usual tiller indicator)
- The function checks for "H" after shaft length codes, but "EXLPT" has the pattern where "H" is not present

Let me confirm: for "15EXLPT ProKicker FourStroke":
- `isTillerMotor()` checks for "H" in specific positions, but this model has `XL` (extra long) + `PT` (power trim) without explicit "H"
- ProKicker motors ARE tiller/kicker motors, so they should be treated as tillers for battery prompt purposes

---

## Solution Plan

### Part 1: Fix Installation Labor Path Guard

**Files to modify:**

1. **`src/pages/quote/QuoteSummaryPage.tsx`** (lines 331-338)
   - Add `state.purchasePath === 'installed'` check before adding "Professional Installation" line

2. **`src/pages/quote/PackageSelectionPage.tsx`** (lines 147-154)
   - Guard `installationLaborCost` with purchase path check

3. **`src/lib/react-pdf-generator.tsx`** (line 130)
   - Ensure `includesInstallation` is correctly passed through to PDF

### Part 2: Fix Battery Prompt Tiller Detection

**Files to modify:**

1. **`src/lib/motor-helpers.ts`** (isTillerMotor function)
   - Add explicit detection for "PROKICKER" as a tiller/kicker motor
   - These motors are always operated via tiller handle even without "H" code

2. **`src/pages/quote/TradeInPage.tsx`** (lines 51-65)
   - Improve electric start detection to handle more edge cases
   - Specifically handle "EXLPT" pattern which includes "E" for electric start

---

## Technical Changes

### Change 1: QuoteSummaryPage.tsx - Guard remote motor installation

**Current code (lines 331-338):**
```typescript
// Professional installation for remote motors
if (!isManualTiller) {
  breakdown.push({
    name: 'Professional Installation',
    price: installationLaborCost,
    description: 'Expert rigging, mounting, and commissioning by certified technicians'
  });
}
```

**Updated code:**
```typescript
// Professional installation for remote motors (ONLY for installed path)
if (!isManualTiller && state.purchasePath === 'installed') {
  breakdown.push({
    name: 'Professional Installation',
    price: installationLaborCost,
    description: 'Expert rigging, mounting, and commissioning by certified technicians'
  });
}
```

### Change 2: QuoteSummaryPage.tsx - Guard installationLaborCost calculation

**Current code (line 228):**
```typescript
const installationLaborCost = !isManualTiller ? 450 : 0;
```

**Updated code:**
```typescript
// Only calculate installation labor for installed path
const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;
```

### Change 3: PackageSelectionPage.tsx - Same guard

**Current code (line 148):**
```typescript
const installationLaborCost = !isManualTiller ? 450 : 0;
```

**Updated code:**
```typescript
const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;
```

### Change 4: motor-helpers.ts - Add ProKicker to tiller detection

**Add to isTillerMotor function:**
```typescript
// ProKicker motors are always tiller/kicker style
if (upperModel.includes('PROKICKER') || upperModel.includes('PRO KICKER')) {
  tillerCache.set(model, true);
  return true;
}
```

### Change 5: TradeInPage.tsx - Improve electric start detection for ProKicker

**Current detection (lines 51-61):**
```typescript
const isElectricStart = useMemo(() => {
  const model = motorModel.toUpperCase();
  return model.includes('EH') || 
         model.includes('EL') || 
         model.includes('ELPT') || 
         model.includes('EXL') || 
         model.includes('EXLPT') ||
         (model.includes('E') && !model.includes('MH') && !model.includes('MLH'));
}, [motorModel]);
```

This should already match "15EXLPT" via the `EXLPT` check, but the tiller check is failing.

**The real fix is in isTillerMotor** - once ProKicker is recognized as a tiller, the `needsBatteryPrompt` condition will be satisfied:
```typescript
const needsBatteryPrompt = isLoosePath && isElectricStart && isTiller;
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Add `purchasePath === 'installed'` guard to installation labor calculation and breakdown entry |
| `src/pages/quote/PackageSelectionPage.tsx` | Add same guard to installation labor calculation |
| `src/lib/motor-helpers.ts` | Add "PROKICKER" detection to `isTillerMotor()` function |

---

## Testing Checklist

After these changes:

1. Select a **15EXLPT ProKicker** motor
2. Choose **"Loose Motor"** path
3. At Trade-In page, verify the **Battery Option Prompt** appears asking about starting battery
4. Complete the quote
5. Verify Summary page shows **NO Professional Installation line** ($450 should not appear)
6. Download PDF and verify **NO installation costs** appear in the breakdown
7. Test a **remote motor** (non-tiller) on **"Installed"** path - verify $450 installation DOES appear
