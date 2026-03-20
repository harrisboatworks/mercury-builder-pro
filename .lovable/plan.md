

# Fix: Washed-Out Pages, Empty Promo Page, and Wrong Cinematic Price

Three distinct issues to solve in one pass.

---

## Issue 1: Promo Selection Page Shows No Content on iPhone

**Root cause**: Every element on PromoSelectionPage uses Framer Motion `initial={{ opacity: 0 }}` with staggered delays up to 0.9s. Combined with PageTransition also starting at `opacity: 0`, iOS compositing can leave layers permanently transparent.

**Fix in `src/pages/quote/PromoSelectionPage.tsx`**:
- Remove all opacity-based entry animations from the logo, badge, headline, description, warranty badge, divider, option cards, countdown, and continue button
- Replace with static rendering or transform-only animations (e.g. `y: 20 → 0`)
- Keep interactive animations (whileHover, whileTap, selected checkmark scale) since those are user-triggered and safe

## Issue 2: Cinematic Intro Shows Wrong (Low) Price

**Root cause**: The cinematic receives `packageSpecificTotals.subtotal` as `finalPrice`, but this depends on `accessoryBreakdown` which includes `completeWarrantyCost`/`premiumWarrantyCost` — both initialized to `0` and fetched asynchronously. The cinematic can start before these settle.

**Fix in `src/pages/quote/QuoteSummaryPage.tsx`**:
- Add a `pricingReady` gate: don't show the cinematic until warranty costs have been fetched (track with a `warrantyCostsLoaded` state flag set after the `fetchWarrantyCosts` effect completes)
- Change cinematic visibility condition from:
  `showCinematic && isMounted && !promoLoading`
  to:
  `showCinematic && isMounted && !promoLoading && warrantyCostsLoaded`

## Issue 3: Summary Page and Other Quote Pages Washed Out on iPhone

**Root cause**: `PageTransition` uses `useState(false)` for iOS detection, so the first render always uses the opacity-based `pageVariants` (`opacity: 0 → 1`). By the time `useEffect` sets `reduceMotion = true`, the damage is done.

**Fix in `src/components/ui/page-transition.tsx`**:
- Call `shouldReduceMotion()` synchronously as the initial state value: `useState(() => shouldReduceMotion())`
- This ensures iOS devices never get the opacity-based animation on first render

**Fix in `src/index.css`** (belt-and-suspenders):
- Add a mobile media query that forces `opacity: 1 !important` on `.page-transition-wrapper` and all direct children of quote page containers
- Target known problem surfaces: PageTransition wrapper, promo selection cards, summary page sections

## Issue 4: BoatInformation Still Uses animate-fade-in and Translucent Backgrounds

**Fix in `src/components/quote-builder/BoatInformation.tsx`**:
- Replace `animate-fade-in` class on all Card elements with static rendering
- Replace `bg-muted/30` on the boat details section with a solid `bg-slate-50` or `bg-muted`

---

## Files to modify

| File | Changes |
|------|---------|
| `src/components/ui/page-transition.tsx` | Synchronous iOS detection via `useState(() => shouldReduceMotion())` |
| `src/pages/quote/PromoSelectionPage.tsx` | Strip all `initial={{ opacity: 0 }}` from every motion element; use transform-only or static |
| `src/pages/quote/QuoteSummaryPage.tsx` | Add `warrantyCostsLoaded` gate for cinematic visibility |
| `src/components/quote-builder/BoatInformation.tsx` | Remove `animate-fade-in`, replace `bg-muted/30` with solid |
| `src/index.css` | Add mobile safeguard forcing `opacity: 1` on quote page containers |

