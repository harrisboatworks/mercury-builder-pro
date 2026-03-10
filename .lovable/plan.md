

# Pricing Health Check — Assessment & Recommendations

## Current State: Solid, with minor cleanup opportunities

The pricing logic is **functionally correct**. The dev-mode drift check is in place and the browser tests confirmed totals match. There are no bugs, but there are a few architectural loose ends worth tidying.

---

## Issue 1: Redundant `totals` calculation (dead code)

**Lines 269-279** compute a `totals` object via `calculateQuotePricing`, but it's never used anywhere in the component — `packageSpecificTotals` (lines 327-339) is the one actually consumed by `PricingTable`, `StickySummary`, PDF, and deposits. This dead code is confusing for future maintainers.

**Fix:** Delete lines 269-279 (the unused `totals` variable).

---

## Issue 2: Drift check dependency array includes entire `state` object

Line 372 has `state` in the dependency array, which means the drift check re-runs on *every* context change — even ones irrelevant to pricing. This is wasteful in dev mode and can cause console noise.

**Fix:** Replace `state` with the specific fields already destructured in the check body (e.g., `state.selectedOptions`, `state.boatInfo?.controlsOption`, etc.).

---

## Issue 3: Financing amount calculated differently than PDF

- **Line 374:** `amountToFinance = (subtotal * 1.13) + DEALERPLAN_FEE` — tax applied to subtotal, fee added after.
- **PDF (line 391):** `motorPrice: (packageTotal + DEALERPLAN_FEE).toFixed(2)` where `packageTotal = subtotal + subtotal*0.13` — same formula, but worth extracting into a shared helper to prevent future drift.

**Fix:** Create a small `getFinanceableAmount(subtotal, taxRate, dealerFee)` helper in `quote-utils.ts` and use it in both places.

---

## Summary of Changes

| File | Change |
|------|--------|
| `QuoteSummaryPage.tsx` | Remove dead `totals` variable (~10 lines) |
| `QuoteSummaryPage.tsx` | Narrow drift-check dependency array |
| `src/lib/quote-utils.ts` | Add `getFinanceableAmount()` helper |
| `QuoteSummaryPage.tsx` | Use `getFinanceableAmount()` in line 374 and PDF block |

All changes are safe refactors — no pricing logic or user-facing behavior changes.

