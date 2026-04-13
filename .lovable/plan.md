

# Pricing Accuracy Audit — All Surfaces

## Finding: Everything is consistent and correct

After tracing the full pricing pipeline across every surface, here's what I confirmed:

### Data layer (database)
All 133 brochure motors have `dealer_price < msrp` — no corrupted values remain. The 9.9hp manual overrides ($2,999–$3,399) are intact in `manual_overrides->sale_price`.

### Pricing hierarchy (identical everywhere)
Every pricing surface uses the same resolution order:
1. `manual_overrides.sale_price` (if not expired)
2. `sale_price`
3. `dealer_price` (if less than MSRP)
4. `msrp` (fallback)

### Surfaces verified

| Surface | File | How it gets price | Status |
|---------|------|-------------------|--------|
| Motor cards | `MotorSelectionPage.tsx` → `MotorCardPreview` | `getDisplayPrices(msrp, price)` | Correct |
| Motor detail sheet | `MotorDetailsSheet.tsx` | `getDisplayPrices(msrp, price)` | Correct |
| Motor detail modal | `MotorDetailsPremiumModal.tsx` | `getDisplayPrices(msrp, price)` | Correct |
| Mobile drawer | `MobileQuoteDrawer.tsx` | `useQuoteRunningTotal()` → `motor.price` | Correct |
| Unified mobile bar | `UnifiedMobileBar.tsx` | `useQuoteRunningTotal()` → `motor.price` | Correct |
| Global sticky bar | `GlobalStickyQuoteBar.tsx` | `useQuoteRunningTotal()` | Correct |
| Quote summary | `QuoteSummaryPage.tsx` | `calculateQuotePricing()` | Correct |
| Pricing table | `PricingTable.tsx` | Receives `PricingBreakdown` from parent | Correct |
| Hero price | `HeroPrice.tsx` | Receives calculated values from parent | Correct |
| Sticky summary | `StickySummary.tsx` | Receives calculated values from parent | Correct |
| Agent API | `agent-quote-api/index.ts` | Same hierarchy, returns `our_price` + `savings` | Correct |
| `getDisplayPrices()` | `pricing.ts` | No inflation, real data only | Correct |
| `getPriceDisplayState()` | `pricing.ts` | No inflation, real data only | Correct |

### Conclusion
No code changes needed. The database fix + inflation removal from the previous steps has made all pricing surfaces accurate and consistent. The drawer, sticky bars, quote summary, motor cards, and agent API all pull from the same corrected data using the same pricing hierarchy.

