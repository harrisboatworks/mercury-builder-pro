

## Remove All Delivery/Shipping References

Audit found several customer-facing pages that mention delivery or shipping. Here are the specific changes needed:

### Files to Edit

**1. `src/pages/quote/QuoteSuccessPage.tsx` (line 168)**
- Change "We'll arrange pickup or delivery at your convenience" → "We'll schedule your pickup at our Gores Landing location"

**2. `src/components/quote-builder/MotorRecommendationQuiz.tsx` (line 386)**
- Change "Available now for immediate delivery!" → "Available now — ready for pickup!"

**3. `src/pages/About.tsx` (line 64)**
- Change "Same-day shipping on most orders." → "Available for pickup at our location."

**4. `src/pages/Terms.tsx` (line 169)**
- Change "before delivery or pickup" → "before pickup"

**5. `src/pages/Terms.tsx` (line 175)**
- Remove "shipping, and handling charges" from pricing paragraph — reword to clarify pickup-only

**6. `src/components/accessories/AccessoryCard.tsx` (lines 39-45)**
- Remove the delivery badge block entirely (local delivery / same-day delivery badges). Keep pickup badges only.

### Files NOT changed (intentionally)
- `supabase/functions/locally-inventory/index.ts` — This is a third-party API response mapper (Locally.io). The data comes from their API; we just won't display delivery badges on our end.
- `useLocallyInventory.ts` — Same reason; keeps the data but we won't render delivery UI.
- `supabase/functions/_shared/mercury-knowledge.ts` — "delivers" used as a verb describing engine performance (e.g., "delivers more thrust"), not shipping. Fine to keep.
- `supabase/functions/generate-spec-sheet-insights/index.ts` — Same, "delivers" = engine performance language.
- Email/SMS edge functions — "email delivery" refers to sending emails, not physical shipping.

