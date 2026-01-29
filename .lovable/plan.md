
# Fix: Battery Prompt Skipped When No Motor Options Available

## Problem Identified

The `OptionsPage.tsx` has an **auto-skip** feature (lines 57-71) that immediately navigates to the next page when no motor-specific options exist in the database. However, this skips the **battery prompt for electric start motors**.

**Flow causing the issue:**
1. User selects "15 EH FourStroke" motor
2. OptionsPage loads, finds no required/recommended/available options for this motor
3. Auto-skip logic triggers, immediately navigates to `/quote/purchase-path`
4. Battery prompt is never shown
5. `state.looseMotorBattery` remains `undefined`
6. Summary page condition `isElectricStart && state.looseMotorBattery?.wantsBattery` fails

## Solution

Modify the auto-skip logic to **only skip if there are no options AND the motor is NOT electric start**. If the motor is electric start, the page must remain visible so the user can answer the battery question.

---

## File to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Update auto-skip condition to account for electric start motors |

---

## Code Changes

### Lines 57-71: Update Auto-Skip Logic

**Current:**
```typescript
// Auto-skip to purchase path if no options available
useEffect(() => {
  if (!isLoading && categorizedOptions && !hasNavigatedRef.current) {
    const hasOptions = 
      categorizedOptions.required.length > 0 ||
      categorizedOptions.recommended.length > 0 ||
      categorizedOptions.available.length > 0;
    
    if (!hasOptions) {
      hasNavigatedRef.current = true;
      dispatch({ type: 'SET_SELECTED_OPTIONS', payload: [] });
      navigate('/quote/purchase-path');
    }
  }
}, [isLoading, categorizedOptions, dispatch, navigate]);
```

**Replace with:**
```typescript
// Auto-skip to purchase path if no options available AND no battery choice needed
useEffect(() => {
  if (!isLoading && categorizedOptions && !hasNavigatedRef.current) {
    const hasOptions = 
      categorizedOptions.required.length > 0 ||
      categorizedOptions.recommended.length > 0 ||
      categorizedOptions.available.length > 0;
    
    // Only auto-skip if no options AND motor doesn't need battery question
    if (!hasOptions && !isElectricStart) {
      hasNavigatedRef.current = true;
      dispatch({ type: 'SET_SELECTED_OPTIONS', payload: [] });
      navigate('/quote/purchase-path');
    }
  }
}, [isLoading, categorizedOptions, dispatch, navigate, isElectricStart]);
```

### Lines 172-181: Update Page Visibility Check

**Current:**
```typescript
const hasOptions = categorizedOptions && (
  categorizedOptions.required.length > 0 ||
  categorizedOptions.recommended.length > 0 ||
  categorizedOptions.available.length > 0
);

// If no options available, return null (navigation happens in useEffect)
if (!hasOptions) {
  return null;
}
```

**Replace with:**
```typescript
const hasOptions = categorizedOptions && (
  categorizedOptions.required.length > 0 ||
  categorizedOptions.recommended.length > 0 ||
  categorizedOptions.available.length > 0
);

// Show page if there are options OR if battery choice is needed
const shouldShowPage = hasOptions || isElectricStart;

// If nothing to show, return null (navigation happens in useEffect)
if (!shouldShowPage) {
  return null;
}
```

---

## Why This Fixes It

| Motor | Options Available | Electric Start? | Before | After |
|-------|-------------------|-----------------|--------|-------|
| 15 EH | ❌ None | ✅ Yes | Skips page, no battery prompt | Shows page with battery prompt only |
| 15 MH | ❌ None | ❌ No (manual) | Skips page correctly | Skips page correctly |
| 60HP Verado | ✅ Some | ✅ Yes | Shows options + battery | Shows options + battery |
| 2.5MH | ❌ None | ❌ No | Skips page correctly | Skips page correctly |

---

## Expected User Flow After Fix

```
Motor Selection → Options Page → [Electric Start?]
                       ↓
       ┌───────────────┴───────────────┐
       │                               │
   YES (Electric)               NO (Manual)
       ↓                               ↓
 Show battery prompt           [Any options?]
 (even if no other               ↓
  options exist)          YES → Show options
       ↓                  NO  → Auto-skip
 User must select                     ↓
 Yes/No for battery         Continue to Purchase Path
       ↓
 Battery choice saved
       ↓
 Continue to Purchase Path
```
