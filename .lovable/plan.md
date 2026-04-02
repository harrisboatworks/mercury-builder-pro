

# Promo Expiry Audit — Hide Everything When No Active Promotions

## Problem
The "Get 7 + Choose One" promo expired March 31, 2026. Multiple components still show hardcoded promo content or don't gracefully handle the empty promotions state. Until a new promo is added to the database, all promo UI should disappear cleanly.

## What already handles it correctly ✅
These components check `promotions.length` or options arrays before rendering:
- **PromoPanel** — returns `null` if no promotions
- **BonusOffersBadge (CurrentPromotions)** — returns `null` if no promos
- **ChooseOneSection** on Promotions page — conditionally rendered with `{chooseOneOptions.length > 0 && ...}`
- **RebateMatrix/Calculator** — conditionally rendered with `{rebateMatrix.length > 0 && ...}`
- **PromoOptionSelector** in QuoteDisplay — wrapped in `{promotions.length > 0 && ...}`
- **WarrantySelector** — uses `getTotalWarrantyBonusYears()` which returns 0 when empty
- **MotorCardPreview `getPromoDisplay()`** — returns null when no warranty promo

## What needs fixing 🔴

### 1. Motor Selection Page — DismissibleBanner (hardcoded, always shows)
**File:** `src/pages/quote/MotorSelectionPage.tsx` lines 972-988
The Get 7 promo banner always renders. Needs to be wrapped in a check for active promotions.
**Fix:** Wrap the `<DismissibleBanner>` in a conditional that only renders when there are active promotions from the hook. Remove hardcoded "Ends March 31, 2026" text — derive from promo data.

### 2. Quote Flow Navigation — Always routes through promo-selection step
**Files:** `src/components/quote-builder/UnifiedMobileBar.tsx`, `src/components/quote/GlobalStickyQuoteBar.tsx`, `src/pages/Index.tsx`
The flow always sends users to `/quote/promo-selection` after trade-in/installation. When there are no promos, this step should be skipped entirely — go straight to `/quote/summary`.
**Fix:** Make `nextPath` conditional: if no active choose-one promotions, skip to `/quote/summary` (or `/quote/package-selection` depending on flow). Apply to UnifiedMobileBar config, GlobalStickyQuoteBar navigation, and Index.tsx `handleContinueQuote`.

### 3. PromoSelectionPage — No empty state
**File:** `src/pages/quote/PromoSelectionPage.tsx`
If someone navigates directly to `/quote/promo-selection` with no active promos, it shows a broken page with hardcoded "7 Years" text and no options.
**Fix:** Add an early return that shows "No promotions currently available" and auto-navigates to the next step.

### 4. Promotions Page — Hero still shows hardcoded content
**File:** `src/components/promotions/PromotionHero.tsx`
The hero section has hardcoded text: "Limited Time: January 12 – March 31, 2026", "Get 7 Years of Coverage", etc. This shows even with no active promos.
**Fix:** The Promotions page (`src/pages/Promotions.tsx`) should show a "no current promotions" state when `promotions.length === 0`. Include a "Get notified" signup form so the page is still useful. Hide the hero, choose-one section, and rebate sections.

### 5. PromotionsPageSEO — Hardcoded structured data
**File:** `src/components/seo/PromotionsPageSEO.tsx`
Contains hardcoded FAQ answers and structured data referencing "Get 7", "March 31, 2026", specific rates. Should be conditional on having active promos.
**Fix:** When no promotions are passed, render generic SEO meta (no specific promo claims).

### 6. PricingTable — Hardcoded "7-Year Warranty" labels
**File:** `src/components/quote-builder/PricingTable.tsx` lines 163-171
Labels like "7-Year Warranty + No Payments" are hardcoded.
**Fix:** When no promo is active, just show "Promotional Savings" or hide the row entirely.

### 7. PromoSummaryCard & PromoSelectionBadge — No empty guards
**Files:** `src/components/quote-builder/PromoSummaryCard.tsx`, `src/components/quote-builder/PromoSelectionBadge.tsx`
These render promo badges even when promotions array might be empty.
**Fix:** Return null when no promotions are active.

### 8. StickyQuoteBar — Shows promo details with no guard
**File:** `src/components/quote/StickyQuoteBar.tsx`
Displays warranty promo info. Already uses `getWarrantyPromotions()` which may return empty, but the promo display section in the parent (`GlobalStickyQuoteBar`) still references `selectedPromoDisplay`.
**Fix:** Only show promo line in sticky bar when there's an active promo.

### 9. Chat prompts reference expired promo
**Files:** `src/components/chat/getContextualPrompts.ts`, `src/lib/quote-nudges.ts`
Hardcoded prompts like "Which promo saves the most money?" and promo nudge messages appear even with no active promo.
**Fix:** Guard promo-specific prompts behind active promo check.

## Summary of files to change

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/quote/MotorSelectionPage.tsx` | Wrap DismissibleBanner in active promo check |
| 2 | `src/components/quote-builder/UnifiedMobileBar.tsx` | Skip promo-selection step when no promos |
| 3 | `src/components/quote/GlobalStickyQuoteBar.tsx` | Skip promo-selection in nav when no promos |
| 4 | `src/pages/Index.tsx` | Skip promo-selection in handleContinueQuote |
| 5 | `src/pages/quote/PromoSelectionPage.tsx` | Add empty state + auto-skip |
| 6 | `src/pages/Promotions.tsx` | Show "no promos" state with newsletter signup |
| 7 | `src/components/promotions/PromotionHero.tsx` | Only render when promo data exists |
| 8 | `src/components/seo/PromotionsPageSEO.tsx` | Generic SEO when no promos |
| 9 | `src/components/quote-builder/PricingTable.tsx` | Dynamic promo labels |
| 10 | `src/components/quote-builder/PromoSummaryCard.tsx` | Return null when no promos |
| 11 | `src/components/quote-builder/PromoSelectionBadge.tsx` | Return null when no promos |
| 12 | `src/components/chat/getContextualPrompts.ts` | Guard promo prompts |
| 13 | `src/lib/quote-nudges.ts` | Guard promo nudges |

## Design principle
Every promo-dependent UI should check `useActivePromotions()` and gracefully degrade. When a new promo is added to the database with `is_active = true` and a future `end_date`, everything automatically reappears — no code changes needed.

