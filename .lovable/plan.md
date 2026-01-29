
# Fix: Battery Selection Not Appearing on Quote Summary

## Root Cause Analysis

After thorough testing and code analysis, I identified the issue:

### Problem
When the user selects "Yes" for the battery on the Options page and clicks "Continue," the `looseMotorBattery` state is dispatched to the context. However, the 1000ms debounced save to localStorage means the state might not be persisted before navigation occurs. When the Summary page loads and reads state, the battery selection may be lost or stale.

### Evidence
1. Battery prompt appears correctly on Options page ✓
2. User selects "Yes" and clicks Continue ✓  
3. Summary page loads but shows no battery line item ✗
4. Console logs show no errors - the state simply isn't there

### Technical Root Cause
In `OptionsPage.tsx`, the `handleContinue` function dispatches `SET_LOOSE_MOTOR_BATTERY` and immediately navigates:

```typescript
// Lines 125-135
if (isElectricStart && batteryChoice !== null) {
  dispatch({ 
    type: 'SET_LOOSE_MOTOR_BATTERY', 
    payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
  });
}

dispatch({ type: 'COMPLETE_STEP', payload: 2 });
navigate('/quote/purchase-path');  // Navigation happens before debounce save!
```

The QuoteContext has a 1000ms debounced save (line 477). Navigation happens instantly, but the save may not complete.

---

## Solution

Force an **immediate synchronous save** to localStorage before navigation, similar to how trade-in changes are handled (which has an immediate save path at lines 435-447 in QuoteContext).

### Approach
Add a helper function to force-save the battery state immediately before navigating away from the Options page. This ensures the state is persisted regardless of the debounce timing.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Force immediate localStorage save before navigation |

---

## Code Change

### OptionsPage.tsx - Add Immediate Save Before Navigation

**Current code (lines 95-136):**
```typescript
const handleContinue = () => {
  if (!categorizedOptions) return;
  
  // Block if battery choice required but not made
  if (isElectricStart && batteryChoice === null) {
    toast.error('Please select a battery option before continuing');
    return;
  }

  // Build selected options...
  const selectedOptions = allOptions
    .filter(opt => localSelectedIds.has(opt.id))
    .map(opt => ({...}));

  dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
  
  // Save battery choice for electric start motors
  if (isElectricStart && batteryChoice !== null) {
    dispatch({ 
      type: 'SET_LOOSE_MOTOR_BATTERY', 
      payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
    });
  }
  
  dispatch({ type: 'COMPLETE_STEP', payload: 2 });
  
  // Navigate to purchase path
  navigate('/quote/purchase-path');
};
```

**Replace with:**
```typescript
const handleContinue = () => {
  if (!categorizedOptions) return;
  
  // Block if battery choice required but not made
  if (isElectricStart && batteryChoice === null) {
    toast.error('Please select a battery option before continuing');
    return;
  }

  // Build selected options...
  const selectedOptions = allOptions
    .filter(opt => localSelectedIds.has(opt.id))
    .map(opt => ({...}));

  dispatch({ type: 'SET_SELECTED_OPTIONS', payload: selectedOptions });
  
  // Save battery choice for electric start motors
  const batteryPayload = isElectricStart && batteryChoice !== null 
    ? { wantsBattery: batteryChoice, batteryCost: BATTERY_COST }
    : state.looseMotorBattery;
    
  if (isElectricStart && batteryChoice !== null) {
    dispatch({ 
      type: 'SET_LOOSE_MOTOR_BATTERY', 
      payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
    });
  }
  
  dispatch({ type: 'COMPLETE_STEP', payload: 2 });
  
  // CRITICAL: Force immediate save before navigation to prevent data loss
  // This bypasses the 1000ms debounce in QuoteContext
  try {
    const currentData = localStorage.getItem('quoteBuilder');
    if (currentData) {
      const parsed = JSON.parse(currentData);
      const updatedState = {
        ...parsed.state,
        selectedOptions,
        looseMotorBattery: batteryPayload,
        completedSteps: [...new Set([...(parsed.state.completedSteps || []), 2])]
      };
      localStorage.setItem('quoteBuilder', JSON.stringify({
        state: updatedState,
        timestamp: Date.now(),
        lastActivity: Date.now()
      }));
      console.log('💾 OptionsPage: Immediate save for battery choice', { 
        wantsBattery: batteryPayload?.wantsBattery,
        batteryCost: batteryPayload?.batteryCost 
      });
    }
  } catch (error) {
    console.error('Failed to force-save options:', error);
  }
  
  // Navigate to purchase path
  navigate('/quote/purchase-path');
};
```

---

## Why This Works

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| User selects battery → Continue | State dispatched but debounce delays save → Navigation happens → State lost | Immediate localStorage write → Navigation → State preserved |
| User skips battery (manual start motor) | Works (no battery state needed) | Works (unchanged) |
| Returning to Options page | Battery choice may be lost | Battery choice persisted |

---

## Expected Results

After this fix:
1. User selects "Yes, add battery" on Options page
2. Clicks "Continue"
3. **Immediate save** of `looseMotorBattery: { wantsBattery: true, batteryCost: 179.99 }` to localStorage
4. Navigation to Purchase Path
5. Quote Summary shows "Marine Starting Battery — $179.99" line item ✓

---

## Technical Notes

This approach mirrors the existing pattern for trade-in data (QuoteContext lines 431-450) where critical state changes trigger an immediate save bypassing the debounce. This ensures pricing consistency across the Quote Builder, Summary, PDF, and Financing views.
