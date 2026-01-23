

# Fix: Loose Motor Path Still Shows Installation + Battery Prompt Placement

## Problem Summary

I've identified the root causes of both issues:

### Issue 1: Professional Installation Still Appearing on Loose Motor Quotes

The PDF quote shows **"Professional Installation - $450.00"** even when "Loose Motor" was selected because:

1. **Line 228 in QuoteSummaryPage.tsx** - The `installationLaborCost` is calculated **without checking the purchase path**:
   ```typescript
   const installationLaborCost = !isManualTiller ? 450 : 0;
   ```
   This adds $450 for ALL remote motors regardless of whether they chose "Loose Motor".

2. **Lines 331-338 in QuoteSummaryPage.tsx** - The accessory breakdown adds the installation item **without checking the purchase path**:
   ```typescript
   if (!isManualTiller) {
     breakdown.push({
       name: 'Professional Installation',
       price: installationLaborCost,  // Always $450 for remote motors!
       ...
     });
   }
   ```

3. **Same issue in PackageSelectionPage.tsx (line 148)** - Identical unguarded calculation.

### Issue 2: Battery Prompt is Below Trade-In Selection

Currently the battery prompt appears **after** the trade-in form on the TradeInPage. You want it to appear **before** the trade-in selection.

### Issue 3: ProKicker Not Recognized as Tiller

The `isTillerMotor()` function doesn't recognize "ProKicker" models (like "15EXLPT ProKicker") as tillers because they don't have the "H" suffix, so the battery prompt never triggers.

---

## Solution Plan

### Part 1: Fix Installation Labor for Loose Motor Path

**File: `src/pages/quote/QuoteSummaryPage.tsx`**

Change line 228 from:
```typescript
const installationLaborCost = !isManualTiller ? 450 : 0;
```
To:
```typescript
// Only charge installation labor for installed path AND remote motors
const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;
```

Change lines 331-338 from:
```typescript
if (!isManualTiller) {
  breakdown.push({...});
}
```
To:
```typescript
if (!isManualTiller && state.purchasePath === 'installed') {
  breakdown.push({...});
}
```

**File: `src/pages/quote/PackageSelectionPage.tsx`**

Change line 148 from:
```typescript
const installationLaborCost = !isManualTiller ? 450 : 0;
```
To:
```typescript
const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;
```

---

### Part 2: Move Battery Prompt Before Trade-In Selection

**File: `src/pages/quote/TradeInPage.tsx`**

Restructure the component to show the battery prompt **first** (when applicable), and only after the user makes a battery selection, show the trade-in selection. This creates a clear two-step flow:

1. **Step 1**: Battery selection (only for electric start tiller motors on loose path)
2. **Step 2**: Trade-in valuation

Changes required:
- Move the `BatteryOptionPrompt` component to render **before** the `TradeInValuation` component
- Add a condition so trade-in section only shows after battery selection is made (when battery prompt is needed)
- Update the UI flow so the battery selection is a clear first step

---

### Part 3: Fix ProKicker Tiller Detection

**File: `src/lib/motor-helpers.ts`**

Add ProKicker detection to the `isTillerMotor` function (around line 458):

```typescript
// Check for explicit tiller indicators
if (upperModel.includes('BIG TILLER') || upperModel.includes('TILLER')) {
  tillerCache.set(model, true);
  return true;
}

// ProKicker motors are tiller/kicker style (even without H suffix)
if (upperModel.includes('PROKICKER') || upperModel.includes('PRO KICKER')) {
  tillerCache.set(model, true);
  return true;
}
```

---

## Technical Implementation Details

### QuoteSummaryPage.tsx Changes

| Line | Current | New |
|------|---------|-----|
| 228 | `const installationLaborCost = !isManualTiller ? 450 : 0;` | `const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;` |
| 332 | `if (!isManualTiller) {` | `if (!isManualTiller && state.purchasePath === 'installed') {` |

### PackageSelectionPage.tsx Changes

| Line | Current | New |
|------|---------|-----|
| 148 | `const installationLaborCost = !isManualTiller ? 450 : 0;` | `const installationLaborCost = (!isManualTiller && state.purchasePath === 'installed') ? 450 : 0;` |

### TradeInPage.tsx Changes

The current render order is:
1. Trade-in selection (Yes/No cards)
2. Trade-in valuation form (if yes)
3. Battery prompt (at the bottom)

The new render order will be:
1. Battery prompt (if `needsBatteryPrompt` is true)
2. Trade-in selection (Yes/No cards) - only after battery selection made, OR immediately if no battery prompt needed
3. Trade-in valuation form (if yes)

### motor-helpers.ts Changes

Add ProKicker detection right after the existing "BIG TILLER" / "TILLER" check:

```typescript
// After line 461, add:
// ProKicker motors are tiller/kicker style motors
if (upperModel.includes('PROKICKER') || upperModel.includes('PRO KICKER')) {
  tillerCache.set(model, true);
  return true;
}
```

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Add `state.purchasePath === 'installed'` guard to line 228 and line 332 |
| `src/pages/quote/PackageSelectionPage.tsx` | Add `state.purchasePath === 'installed'` guard to line 148 |
| `src/pages/quote/TradeInPage.tsx` | Restructure to show battery prompt BEFORE trade-in selection |
| `src/lib/motor-helpers.ts` | Add ProKicker detection to `isTillerMotor()` function |

---

## Testing Checklist

After implementation:

1. Select **15EXLPT ProKicker** motor
2. Choose **"Loose Motor"** path  
3. On Trade-In page, verify **Battery Option Prompt appears FIRST** (before trade-in Yes/No)
4. Select battery option, then verify trade-in selection appears
5. Complete the quote to Summary page
6. Verify **NO "Professional Installation - $450"** line appears
7. Download PDF and verify **NO installation costs** in the breakdown
8. Test a **remote motor** on **"Installed"** path - verify $450 installation DOES appear correctly

