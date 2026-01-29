
# Fix: Reset Selected Options When Changing Motors

## Problem
When a user selects a different motor, the previously selected options (like the 25L Fuel Tank) remain selected and continue to be added to the total price. This leads to incorrect pricing and potentially incompatible options being applied to the new motor.

## Root Cause
In `src/contexts/QuoteContext.tsx`, the `SET_MOTOR` action resets several fields (like `previewMotor`, `configuratorStep`, `configuratorOptions`) but does **not** reset `selectedOptions`:

```typescript
case 'SET_MOTOR':
  const motorSpecs = findMotorSpecs(action.payload.hp, action.payload.model);
  return { 
    ...state, 
    motor: action.payload, 
    motorSpecs, 
    previewMotor: null, 
    configuratorStep: null, 
    configuratorOptions: null 
    // ❌ selectedOptions NOT reset - options from previous motor persist
  };
```

## Solution

Add `selectedOptions: []` to the `SET_MOTOR` action return statement to clear any previously selected options when a new motor is chosen.

---

## File to Modify

| File | Change |
|------|--------|
| `src/contexts/QuoteContext.tsx` | Add `selectedOptions: []` to the `SET_MOTOR` case return |

---

## Code Change

**Line 180** - Update the return statement:

```typescript
case 'SET_MOTOR':
  const motorSpecs = findMotorSpecs(action.payload.hp, action.payload.model);
  return { 
    ...state, 
    motor: action.payload, 
    motorSpecs, 
    previewMotor: null, 
    configuratorStep: null, 
    configuratorOptions: null,
    selectedOptions: []  // ✅ Reset options when motor changes
  };
```

---

## Result

After this fix:
- Selecting a new motor will clear any previously selected fuel tanks, accessories, or add-ons
- The Options page will show a fresh state with no pre-selected items
- The sticky bars and summary will correctly reflect only options selected for the current motor
- Prevents incompatible options from carrying over between different motor types
