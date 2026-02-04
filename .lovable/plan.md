
# Fix: Cinematic Intro Loading Twice

## Problem Identified

The cinematic reveal animation plays twice because the `useEffect` that controls `showCinematic` depends on `[state.motor]` - the entire motor object. During the initial page load:

1. The page mounts with `state.motor` in one state (possibly null or loading)
2. The effect fires and sets `showCinematic = true`
3. QuoteContext finishes loading from localStorage, `state.motor` gets a new object reference
4. The effect fires **again** because the object reference changed
5. The cinematic animation restarts

## Solution

Change the effect to depend on a **stable motor identifier** (`state.motor?.id` or `state.motor?.sku`) instead of the entire motor object, and add guards to prevent re-triggering.

---

## Implementation

### File: `src/pages/quote/QuoteSummaryPage.tsx`

**Current (problematic) code:**
```typescript
useEffect(() => {
  const hasSeenReveal = sessionStorage.getItem('quote-reveal-seen');
  const lastRevealedMotor = sessionStorage.getItem('quote-reveal-motor-id');
  const currentMotorId = state.motor?.id || (state.motor as any)?.sku;
  
  if (!hasSeenReveal || (currentMotorId && lastRevealedMotor !== String(currentMotorId))) {
    setShowCinematic(true);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}, [state.motor]);
```

**Fixed code:**
```typescript
// Extract stable motor ID outside the effect
const currentMotorId = state.motor?.id || (state.motor as any)?.sku;

useEffect(() => {
  // Guard: if cinematic is already showing, don't re-trigger
  if (showCinematic) return;
  
  const hasSeenReveal = sessionStorage.getItem('quote-reveal-seen');
  const lastRevealedMotor = sessionStorage.getItem('quote-reveal-motor-id');
  
  // Only show if never seen OR motor changed (using stable ID comparison)
  if (!hasSeenReveal || (currentMotorId && lastRevealedMotor !== String(currentMotorId))) {
    setShowCinematic(true);
  }
  
  window.scrollTo({ top: 0, behavior: 'instant' });
}, [currentMotorId]); // Use stable ID, not full object
```

---

## Why This Works

| Before | After |
|--------|-------|
| Depends on `state.motor` object reference | Depends on `currentMotorId` string value |
| Effect fires when object reference changes | Effect only fires when motor ID actually changes |
| No guard against re-triggering | Guard prevents re-trigger if already showing |

---

## Additional Safety: Mount Flag

As extra protection, add a ref to track if the effect has already run on this mount:

```typescript
const cinematicTriggeredRef = useRef(false);

useEffect(() => {
  // Prevent double-trigger on same mount
  if (cinematicTriggeredRef.current || showCinematic) return;
  
  const hasSeenReveal = sessionStorage.getItem('quote-reveal-seen');
  const lastRevealedMotor = sessionStorage.getItem('quote-reveal-motor-id');
  
  if (!hasSeenReveal || (currentMotorId && lastRevealedMotor !== String(currentMotorId))) {
    cinematicTriggeredRef.current = true;
    setShowCinematic(true);
  }
  
  window.scrollTo({ top: 0, behavior: 'instant' });
}, [currentMotorId, showCinematic]);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Fix useEffect dependency + add guards |

---

## Expected Outcome

- Cinematic plays **exactly once** when entering the summary page
- Motor changes still trigger a fresh cinematic (correct behavior)
- No double animation during initial page load
