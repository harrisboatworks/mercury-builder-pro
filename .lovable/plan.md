

# Remove Redundant "Back to Motor" Button

## The Issue

On the Boat Info page (`/quote/boat-info`), there's a "Back to Motor" button at the bottom of the form that's redundant because:

1. **Page already has back navigation** - The `BoatInfoPage.tsx` has a "Back to Purchase Path" button at the top
2. **Label is misleading** - The button says "Back to Motor" but the actual previous step is Purchase Path, not Motor Selection
3. **Confusing UX** - Two back buttons doing the same thing clutters the interface

## Current Flow

```text
┌─────────────────────────────────────────────────────┐
│  BoatInfoPage.tsx                                    │
│  ┌─────────────────────────────────────────────────┐│
│  │ [← Back to Purchase Path] ← Top-level back      ││
│  │                                                 ││
│  │  BoatInformation.tsx (internal wizard)          ││
│  │  ┌─────────────────────────────────────────────┐││
│  │  │ Step 0: Boat Type Selection                │││
│  │  │                                             │││
│  │  │ [← Back to Motor]  [Skip]  [Next →]        │││  ← Redundant!
│  │  └─────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Solution

Hide the back button when on step 0 of the wizard. The page-level back navigation handles exiting the wizard. Only show "Previous" when navigating between internal wizard steps (step 1+).

### File: `src/components/quote-builder/BoatInformation.tsx`

**Current (lines 1055-1059):**
```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-6 border-t gap-3">
  <Button type="button" variant="outline" onClick={handlePrev} className="...">
    <ArrowLeft className="w-4 h-4" />
    {currentStep === 0 ? 'Back to Motor' : 'Previous'}
  </Button>
```

**After:**
```tsx
<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-6 border-t gap-3">
  {/* Only show Previous button on steps after the first - page handles exit navigation */}
  {currentStep > 0 ? (
    <Button type="button" variant="outline" onClick={handlePrev} className="...">
      <ArrowLeft className="w-4 h-4" />
      Previous
    </Button>
  ) : (
    <div /> {/* Empty spacer to maintain layout */}
  )}
```

## Result

| Step | Before | After |
|------|--------|-------|
| Step 0 (Boat Type) | Shows "Back to Motor" button | No back button (page has its own) |
| Step 1+ (Transom, Controls, etc.) | Shows "Previous" button | Shows "Previous" button (unchanged) |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/BoatInformation.tsx` | Conditionally hide back button on step 0 |

