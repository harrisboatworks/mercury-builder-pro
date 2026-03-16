

# Fix: Package Selection Step Still Reachable

## Root Cause

Two files were missed in the previous optimization that still route users to `/quote/package-selection`:

1. **`src/components/quote-builder/UnifiedMobileBar.tsx`** (line 170-173) — The mobile bottom bar config for `/quote/promo-selection` has `nextPath: '/quote/package-selection'` and label "Choose Package". This is the primary culprit since the user is on mobile.

2. **`src/pages/Index.tsx`** (line 134-135) — The "resume quote" logic on the homepage navigates to package-selection if no package is set, instead of going to summary (where it would auto-set Essential).

## Changes

### File 1: `src/components/quote-builder/UnifiedMobileBar.tsx`
- Line 171-172: Change `primaryLabel` to `'Apply Bonus & Continue'` and `nextPath` to `'/quote/summary'`
- Add auto-dispatch of Essential package before navigation (or simply change the path since `PromoSelectionPage.handleContinue` already handles the dispatch)
- Remove or repurpose the `/quote/package-selection` step config entry (lines 186+)

### File 2: `src/pages/Index.tsx`
- Line 134-135: Change the `!state.selectedPackage` branch to navigate to `/quote/summary` instead of `/quote/package-selection`

These two changes close the remaining paths to the package-selection page in the normal flow.

