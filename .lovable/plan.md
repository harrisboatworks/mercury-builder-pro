

# Site Optimization: 4 Priorities

## Priority 1: Fix Promo Selection Page (100% drop-off)

**Problem**: Lines 106-109 of `PromoSelectionPage.tsx` clear the selection on every mount, forcing re-selection on back-navigation. The CTA says "Choose Package" which is confusing. Dark theme is jarring.

**Changes in `src/pages/quote/PromoSelectionPage.tsx`**:
- Remove the `useEffect` that dispatches `SET_PROMO_DETAILS` with nulls on mount (lines 106-109). Instead, restore from `state.selectedPromoOption` if it exists.
- Initialize `selectedOption` from `state.selectedPromoOption` and `selectedRate` from `state.selectedPromoRate/Term`.
- Rename CTA button from "Choose Package" to "Apply Bonus & Continue".
- Change the dark background (`from-stone-950 via-stone-900 to-stone-950`) to match the rest of the funnel's light theme (`from-background via-secondary/30 to-accent/50`), adjusting text colors accordingly.

## Priority 2: Auto-Select Essential Package & Skip Package Step

**Problem**: The package step is an upsell. With Get7 already providing 7 years warranty, it's less relevant and causes friction.

**Changes**:

1. **`src/pages/quote/PromoSelectionPage.tsx`** — change `handleContinue` to navigate directly to `/quote/summary` instead of `/quote/package-selection`. Before navigating, auto-dispatch `SET_SELECTED_PACKAGE` with the Essential ("good") package and `SET_WARRANTY_CONFIG` with current promo coverage years.

2. **`src/pages/quote/QuoteSummaryPage.tsx`** — update the redirect guard (lines 149-150) to stop redirecting to package-selection when no package is set; instead auto-set Essential. Change `handleBack` to go to `/quote/promo-selection` instead of `/quote/package-selection`.

3. **`src/components/quote/GlobalStickyQuoteBar.tsx`** — update navigation flow: from promo-selection go directly to summary (skip package-selection).

4. **`src/components/quote-builder/QuoteProgressStepper.tsx`** — hide or remove the package-selection step from the visible stepper.

5. The route in `App.tsx` stays for now (saved quotes may link to it), but users won't be routed there in the normal flow.

## Priority 3: Streamline Installation Config (50% drop-off)

**Problem**: No defaults or guidance causes decision paralysis in `InstallationConfig.tsx`.

**Changes in `src/components/quote-builder/InstallationConfig.tsx`**:
- Add a `badge: "Most Common"` to `controlChoices[0]` (Side-Mount) and `steeringChoices[0]` (Cable Steering) in `src/config/visualChoices.ts`.
- In `OptionGallery.tsx`, render the `badge` property if present (already supported — the component renders `choice.badge`).

## Priority 4: Motor Popularity Badges

**Problem**: No social proof on high-demand motors.

**Changes in `src/components/motors/MotorCardPreview.tsx`** (or equivalent motor card):
- Add a "Popular" badge for motors with HP in a defined popular set (e.g., 115, 150) — a small badge in the card corner, similar to the existing stock badges.

---

**Files touched**: ~7 files. The biggest win is Priority 1 + 2 (eliminating two friction points and one unnecessary step).

