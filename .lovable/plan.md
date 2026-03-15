

# Fix Pricing Drift Between Running Total and Summary Page

## Root Cause

The dev-mode cross-check compares `calculateRunningTotal` (which models the step-by-step quote builder state) against `packageSpecificTotals` (which uses `buildAccessoryBreakdown` for the selected package). They diverge because `buildAccessoryBreakdown` includes items the running total engine doesn't know about:

1. **Propeller allowance** (~$200-400) — added when motor doesn't include a prop and customer hasn't opted out
2. **Package warranty extension costs** — "better" and "best" packages add warranty costs beyond what's in `state.warrantyConfig`
3. **Premium fuel tank** ($199) — "best" package auto-adds a fuel tank if none selected

These are legitimate package-specific costs that only exist on the summary page. The running total engine is correct for mid-flow pricing; the summary page is correct for final pricing.

## Fix Strategy

**Update the cross-check** (not the running total engine) to include package-specific additions so the comparison is apples-to-apples. The running total engine should remain the source of truth for the mobile bar/drawer during the flow.

### Changes in `QuoteSummaryPage.tsx` (lines 336-362)

Update the dev cross-check to:
1. Add propeller cost to the running total check's `selectedOptions` if the motor doesn't include a prop and the customer hasn't opted out
2. Add the package warranty delta (completeWarrantyCost or premiumWarrantyCost) to the `warrantyPrice` passed to the check
3. Add the premium fuel tank cost ($199) for "best" package if no fuel tank already selected
4. Essentially: pass the same line items that `buildAccessoryBreakdown` produces into the cross-check so both sides compute from equivalent inputs

This keeps the running total engine clean and package-unaware (correct for mid-flow), while making the dev diagnostic actually compare equivalent data sets.

### Files
- `src/pages/quote/QuoteSummaryPage.tsx` — update the DEV cross-check effect (~lines 336-369)

