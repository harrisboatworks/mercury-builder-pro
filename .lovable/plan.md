
# Handle Financing-Dependent Promo Options for Sub-$5K Motors

## The Problem

Looking at the screenshot, both "6 Months No Payments" and "Factory Rebate" are showing for a 3.5HP motor that costs $1,548. The "6 Months No Payments" option is a **financing-dependent benefit** (deferred payment plan) that shouldn't be available for purchases under $5,000.

Currently, `PromoSelectionPage.tsx` only filters out "Special Financing" when the amount is below the $5,000 threshold, but "6 Months No Payments" also requires financing and should be filtered too.

## Recommended Approach

**Hide both financing-dependent options** ("no_payments" and "special_financing") for sub-$5K motors, leaving only the "Factory Rebate" as the available option.

This is safer than auto-selecting because:
- It's clear and honest - users see what's actually available
- Avoids confusion when they expect to defer payments but can't
- The rebate is genuinely valuable at any price point
- Simpler UI with just one option for small motors

## Implementation

### File: `src/pages/quote/PromoSelectionPage.tsx`

**Change 1**: Rename eligibility flag to be more inclusive (lines 65-66)

```tsx
// Before
const isEligibleForSpecialFinancing = estimatedFinancingAmount >= FINANCING_MINIMUM;

// After - applies to all financing-dependent options
const isEligibleForFinancing = estimatedFinancingAmount >= FINANCING_MINIMUM;
```

**Change 2**: Update filter to exclude both financing-dependent options (lines 95-103)

```tsx
// Before
const eligibleOptions = useMemo(() => {
  return options.filter(option => {
    if (option.id === 'special_financing' && !isEligibleForSpecialFinancing) {
      return false;
    }
    return true;
  });
}, [options, isEligibleForSpecialFinancing, rebateAmount, lowestRate]);

// After - filter both financing-dependent options
const eligibleOptions = useMemo(() => {
  return options.filter(option => {
    // Both "no_payments" and "special_financing" require financing eligibility
    if ((option.id === 'no_payments' || option.id === 'special_financing') && !isEligibleForFinancing) {
      return false;
    }
    return true;
  });
}, [options, isEligibleForFinancing, rebateAmount, lowestRate]);
```

**Change 3**: Update rate selector condition to use renamed variable (lines 407-408)

```tsx
// Before
{selectedOption === 'special_financing' && isEligibleForSpecialFinancing && financingRates.length > 0 && (

// After
{selectedOption === 'special_financing' && isEligibleForFinancing && financingRates.length > 0 && (
```

**Change 4**: Update auto-scroll effect dependency (line 121)

```tsx
// Before
if (hasUserInteracted && selectedOption === 'special_financing' && isEligibleForSpecialFinancing && rateSelectorRef.current) {

// After
if (hasUserInteracted && selectedOption === 'special_financing' && isEligibleForFinancing && rateSelectorRef.current) {
```

### File: `src/components/quote-builder/PromoOptionSelector.tsx`

Apply the same fix to the shared component (used elsewhere in the app):

**Change 1**: Add financing eligibility check (around line 26)

```tsx
// Add after line 27
import { FINANCING_MINIMUM } from '@/lib/finance';

// Add after rebateAmount memo (around line 38)
const isEligibleForFinancing = totalAmount >= FINANCING_MINIMUM;
```

**Change 2**: Filter options before rendering (modify line 147)

```tsx
// Before - renders all options
{options.map((option) => {

// After - filter to eligible options
{options.filter(opt => {
  if ((opt.id === 'no_payments' || opt.id === 'special_financing') && !isEligibleForFinancing) {
    return false;
  }
  return true;
}).map((option) => {
```

**Change 3**: Update recommended option logic (lines 46-57)

```tsx
// Before
const recommendedOption = useMemo((): PromoOptionType => {
  if (motorHP >= 150 && rebateAmount >= 500) {
    return 'cash_rebate';
  }
  if (totalAmount >= 15000 && financingRates.length > 0) {
    return 'special_financing';
  }
  return 'no_payments';
}, [motorHP, rebateAmount, totalAmount, financingRates]);

// After - only recommend eligible options
const recommendedOption = useMemo((): PromoOptionType => {
  // If not eligible for financing, only rebate is available
  if (totalAmount < FINANCING_MINIMUM) {
    return 'cash_rebate';
  }
  // High HP motors benefit most from rebate
  if (motorHP >= 150 && rebateAmount >= 500) {
    return 'cash_rebate';
  }
  // Large financed amounts benefit from lower rates
  if (totalAmount >= 15000 && financingRates.length > 0) {
    return 'special_financing';
  }
  return 'no_payments';
}, [motorHP, rebateAmount, totalAmount, financingRates]);
```

---

## Expected Result

For a 3.5HP motor at $1,548:
- Only **"Factory Rebate"** option is shown
- The grid adjusts to single column for one option
- User clearly sees their only available bonus
- No confusion about deferred payments they can't actually use

For motors over $5,000:
- All three options remain available as before
- No change to current behavior

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/quote/PromoSelectionPage.tsx` | 1. Rename `isEligibleForSpecialFinancing` to `isEligibleForFinancing`<br>2. Filter both `no_payments` and `special_financing`<br>3. Update rate selector condition<br>4. Update auto-scroll effect |
| `src/components/quote-builder/PromoOptionSelector.tsx` | 1. Import `FINANCING_MINIMUM`<br>2. Add eligibility check<br>3. Filter options before rendering<br>4. Update recommended option logic |
