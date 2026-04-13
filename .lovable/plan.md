
Fix the missing MSRP display on the live motor selection page

What I found
- This is not a database-missing-MSRP problem anymore.
- I checked live data: `motor_models` has MSRP on 135/135 motors, with 0 missing MSRP rows.
- The live route `/quote/motor-selection` uses `src/pages/quote/MotorSelectionPage.tsx`, which renders `MotorCardPreview`.
- Those live components suppress the struck-through MSRP whenever the resolved selling price is equal to MSRP:
  - `MotorCardPreview.tsx` only shows MSRP when `msrp > price`
  - `MotorDetailsPremiumModal.tsx` / `MotorDetailsSheet.tsx` only show it when `msrp !== price`
- Result: about 24 motors currently have MSRP in the DB, but the UI hides it.
- The older `src/components/quote-builder/MotorSelection.tsx` already has the “always show MSRP/Our Price” display logic via `getPriceDisplayState(..., true)`, but the live page is not using that path.

Implementation plan
1. Do not touch the database again
   - No more `sale_price` data edits.
   - Keep the rollback in place; this is now a presentation bug, not a data bug.

2. Centralize the display rule in `src/lib/pricing.ts`
   - Add a shared helper that returns display values, not just flags:
     - `displayMsrp`
     - `displayPrice`
     - `showMsrp`
     - `showSavings`
     - `savingsRounded`
     - `isArtificialDiscount`
   - Reuse the existing “inflate equal prices” behavior already in the codebase so equal-price motors still render as “MSRP / Our Price” on selection surfaces.
   - Keep this display-only. Actual quote totals and saved prices must not change.

3. Fix every live pricing surface on `/quote/motor-selection`
   - Update:
     - `src/components/motors/MotorCardPreview.tsx`
     - `src/components/motors/MotorDetailsPremiumModal.tsx`
     - `src/components/motors/MotorDetailsSheet.tsx`
     - `src/components/motors/MotorCardPremium.tsx`
   - Replace the current raw checks (`msrp > price`, `msrp !== price`) with the shared display helper so cards, modal, and detail bar all agree.

4. Fix the shared pricing component too
   - Update `src/components/pricing/LuxuryPriceDisplay.tsx` so it actually respects artificial/equal-price display states.
   - Right now it computes `priceState` but still uses raw `msrp !== salePrice` logic, so it can reproduce the same bug elsewhere.

5. Remove drift between old and new selection flows
   - Refactor `src/components/quote-builder/MotorSelection.tsx` to use the same shared display helper instead of its local duplicate calculations.
   - That keeps the legacy builder, staging pages, and live route from drifting again.

Validation
- Confirm equal-price motors now show MSRP + Our Price on the live page:
  - 40 ELPT FourStroke
  - 90 ELPT FourStroke
- Confirm true-discount motors still show real savings, not synthetic-only savings:
  - examples where `dealer_price < msrp`
- Confirm card, modal, and detail sheet all show the same pricing presentation.
- Confirm quote math, financing math, and saved quote records are unchanged.

Technical note
- Root cause: UI suppression, not missing MSRP data.
- Current DB status:
  - 135 total motors
  - 135 with MSRP
  - 0 missing MSRP
  - about 24 currently hidden by front-end equality checks
