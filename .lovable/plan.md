

# Move Battery Choice to Options Page

## Current State

Currently, the battery prompt for electric start motors appears:
- **Loose Motor Path**: On the Trade-In page (first step) - using `BatteryOptionPrompt`
- **Installed Path**: Automatically added for Better/Best packages in QuoteSummaryPage

## Problem

You're right that the battery decision should be made earlier, at the **Options stage**, regardless of purchase path:
1. Both loose motor AND installed customers may already have a battery
2. Currently loose motor customers see the prompt too late (Trade-In page)
3. Installed customers never get asked - battery is auto-added for Better/Best packages

## Solution

Add the battery prompt to the **OptionsPage** for all electric start motors, making it part of the "Required Items" section with a mandatory Yes/No answer.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/OptionsPage.tsx` | Add battery prompt section for electric start motors |
| `src/pages/quote/TradeInPage.tsx` | Remove battery prompt (no longer needed here) |
| `src/pages/quote/QuoteSummaryPage.tsx` | Update battery logic to use `looseMotorBattery` for ALL paths, not just loose |
| `src/contexts/QuoteContext.tsx` | Rename `looseMotorBattery` to `batteryChoice` (applies to both paths now) |

---

## Technical Details

### 1. OptionsPage.tsx - Add Battery Section

After the "Required Items" section, add a conditional battery prompt:

```typescript
import { BatteryOptionPrompt, BATTERY_COST } from '@/components/quote-builder/BatteryOptionPrompt';
import { hasElectricStart } from '@/lib/motor-config-utils';

// Inside component
const isElectricStart = hasElectricStart(state.motor?.model || '');
const [batteryChoice, setBatteryChoice] = useState<boolean | null>(
  state.looseMotorBattery?.wantsBattery ?? null
);

// Block Continue if electric start and no battery choice made
const canContinue = !isElectricStart || batteryChoice !== null;

// Save battery choice on continue
const handleContinue = () => {
  // ... existing option saving logic
  
  if (isElectricStart && batteryChoice !== null) {
    dispatch({ 
      type: 'SET_LOOSE_MOTOR_BATTERY', 
      payload: { wantsBattery: batteryChoice, batteryCost: BATTERY_COST } 
    });
  }
  
  navigate('/quote/purchase-path');
};
```

**UI placement**: After Required Items, before Recommended Options:

```tsx
{/* Battery Requirement for Electric Start */}
{isElectricStart && (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xl font-semibold">Starting Battery</h2>
      <Badge variant="destructive">Required Answer</Badge>
    </div>
    <BatteryOptionPrompt 
      onSelect={setBatteryChoice}
      selectedOption={batteryChoice}
    />
    {batteryChoice === null && (
      <p className="text-sm text-destructive mt-2">
        Please select an option before continuing
      </p>
    )}
  </div>
)}
```

### 2. TradeInPage.tsx - Remove Battery Prompt

Remove:
- `needsBatteryPrompt` logic (lines 49-65)
- `batterySelection` state
- `BatteryOptionPrompt` component and rendering
- Battery-related sections from the UI

### 3. QuoteSummaryPage.tsx - Update Battery Logic

Change the battery breakdown logic to use the user's choice for ALL paths:

**Current (lines 362-378):**
```typescript
// Battery for electric start motors (Better/Best packages on installed path)
if (!isManualStart && (selectedPackage === 'better' || selectedPackage === 'best')) {
  breakdown.push({
    name: 'Marine Battery',
    price: batteryCost,
    description: 'Marine starting battery (required for electric start)'
  });
}

// Battery for loose motor path (if user opted for it)
if (state.purchasePath === 'loose' && state.looseMotorBattery?.wantsBattery) {
  // ...
}
```

**New:**
```typescript
// Battery for electric start motors - respect user's choice from Options page
if (!isManualStart && state.looseMotorBattery?.wantsBattery) {
  breakdown.push({
    name: 'Marine Starting Battery',
    price: state.looseMotorBattery.batteryCost,
    description: 'Marine starting battery for electric start motor'
  });
}
```

This respects the user's choice for BOTH loose and installed paths.

### 4. Optional: Rename Context Field (can do later)

Consider renaming `looseMotorBattery` → `batteryChoice` in `QuoteContext.tsx` since it now applies to both paths. This is a refactor that can be done in a follow-up if desired.

---

## User Flow After Changes

```text
Motor Selection → Options Page → Purchase Path → ...
                       ↓
            [Electric Start Motor?]
                       ↓
         ┌─────────────┴─────────────┐
         │    YES                    │ NO
         ↓                           ↓
   Show Battery Prompt          Continue normally
   (Required answer)
         ↓
   User selects Yes/No
         ↓
   Save choice to context
         ↓
   (Later in Summary: only add battery cost if user said Yes)
```

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| 9.9EH (electric tiller) | Battery prompt shown, user must answer |
| 9.9MH (manual tiller) | No battery prompt |
| 60HP Verado (electric, no code) | Battery prompt shown (40+ HP defaults to electric) |
| User goes back to Options | Previous choice remembered |
| Loose motor + Yes battery | Battery added to summary at $179.99 |
| Installed + Yes battery | Battery added to summary at $179.99 |
| Any path + No battery | No battery in summary |

