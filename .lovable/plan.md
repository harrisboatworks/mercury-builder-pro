
# Fix Motor Deep-Link to Open Specific Motor Modal

## Problem

When a customer clicks the link in an SMS (e.g., `quote.harrisboatworks.ca/quote?motor=abc123`):
- The page loads correctly
- The motor selection page shows
- But the **motor detail modal doesn't auto-open** with the specific motor

## Root Cause

There are two competing `useEffect` hooks handling the `?motor=` URL parameter:

| Hook Location | What It Does | Problem |
|---------------|--------------|---------|
| Lines 411-424 | Sets `voiceShowMotorId`, deletes URL param | Runs first, clears URL before the other hook can see it |
| Lines 717-739 | Sets `deepLinkedMotorId` and opens modal properly | Never runs because URL param is already gone |

Additionally, the effect that handles `voiceShowMotorId` (lines 742-762) doesn't set `deepLinkedMotorId`, which is what the `MotorConfiguratorModal` uses to pre-select the specific variant.

## Solution

Remove the duplicate/conflicting useEffect (lines 411-424) and update the voice handler effect (lines 742-762) to also set `deepLinkedMotorId` so the modal opens with the correct motor pre-selected.

---

## File to Modify

`src/pages/quote/MotorSelectionPage.tsx`

---

## Technical Changes

### 1. Remove the Redundant useEffect (Lines 411-424)

Delete this entire block - it's a duplicate that runs too early and conflicts with the proper handler:

```typescript
// DELETE THIS BLOCK
useEffect(() => {
  const motorIdParam = searchParams.get('motor');
  if (motorIdParam && !loading && motors.length > 0) {
    const targetMotor = motors.find(m => m.id === motorIdParam);
    if (targetMotor) {
      console.log('[MotorSelectionPage] Auto-opening motor from URL param:', motorIdParam);
      setVoiceShowMotorId(motorIdParam);
      searchParams.delete('motor');
      setSearchParams(searchParams, { replace: true });
    }
  }
}, [searchParams, setSearchParams, loading, motors]);
```

### 2. Update Voice Handler Effect (Lines 742-762)

Add `setDeepLinkedMotorId(voiceShowMotorId)` so the modal knows which specific variant to pre-select:

```typescript
useEffect(() => {
  if (!voiceShowMotorId || processedMotors.length === 0 || groupedMotors.length === 0) return;
  
  console.log('[MotorSelectionPage] Processing voice show motor:', voiceShowMotorId);
  
  const motor = processedMotors.find(m => m.id === voiceShowMotorId);
  if (motor) {
    const group = groupedMotors.find(g => g.variants.some(v => v.id === voiceShowMotorId));
    if (group) {
      setSelectedGroup(group);
      setDeepLinkedMotorId(voiceShowMotorId);  // <-- ADD THIS LINE
      setShowConfigurator(true);
      dispatch({ type: 'SET_PREVIEW_MOTOR', payload: motor });
    }
  }
  
  setVoiceShowMotorId(null);
}, [voiceShowMotorId, processedMotors, groupedMotors, dispatch]);
```

---

## Expected Result

| Before | After |
|--------|-------|
| Customer clicks SMS link → Motor selection page loads → Nothing happens | Customer clicks SMS link → Motor selection page loads → **Modal opens with the specific motor showing** |

The modal will:
1. Open automatically
2. Show the correct motor's details
3. Have the motor "added to cart" (shown in the sticky bar)
4. Allow the customer to continue building their quote

---

## Testing

After implementation:
1. Send a new test SMS with motor link
2. Click the link
3. Verify the motor detail modal opens immediately with the correct motor displayed
