

# Standalone Trade-In Value Estimator Page

## What We're Building

A new public page at `/trade-in-value` where anyone can check their outboard motor's trade-in value — no quote required. Uses the existing valuation engine and form fields, but wrapped in its own standalone layout with SEO metadata and a CTA to start a full quote.

## Approach

1. **New page `src/pages/TradeInValuePage.tsx`**
   - Self-contained page with its own state management (no QuoteContext dependency)
   - Reuses the `TradeInValuation` component in a "standalone" mode — always starts with the form visible (no Yes/No toggle needed)
   - Hero section with heading like "What's Your Outboard Worth?" and brief copy
   - After estimate shows, CTA button: "Start a Quote With This Trade-In" → navigates to `/quote/motor-selection` (or `/quote/trade-in` with pre-filled data)
   - SEO: title, meta description, BreadcrumbList schema for "Home > Trade-In Value"

2. **Modify `TradeInValuation` component**
   - Add an optional `standalone?: boolean` prop
   - When `standalone` is true: skip the Yes/No trade-in toggle, show the form immediately, hide the "No trade-in / Skip" option
   - Everything else (fields, validation, estimation logic) stays identical

3. **Add route in `App.tsx`**
   - Lazy-load `TradeInValuePage` at `/trade-in-value`

4. **Navigation link**
   - Add "Trade-In Value" to the header nav / hamburger menu so it's discoverable

## Files Changed

| File | Change |
|------|--------|
| `src/pages/TradeInValuePage.tsx` | New standalone page with hero, form, CTA |
| `src/components/quote-builder/TradeInValuation.tsx` | Add `standalone` prop to skip Yes/No toggle |
| `src/App.tsx` | Add lazy import + route for `/trade-in-value` |
| `src/components/ui/luxury-header.tsx` | Add nav link |
| `src/components/ui/HamburgerMenu.tsx` | Add mobile nav link |

