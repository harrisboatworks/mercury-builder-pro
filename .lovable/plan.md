# Motor selection page reskin — Pass 1 (cards + page chrome)

Apply the navy/cream/gold/mercury-red design system from `/repower` to the motor grid. **Visual layer only** — no data, hooks, filters, modal logic, or routing change.

## Audit (what exists today)

- **Page**: `src/pages/quote/MotorSelectionPage.tsx` — handles data fetch, filters, voice events, deep-linking, schema. Renders `MotorCardPreview` in a grid.
- **Card**: `src/components/motors/MotorCardPreview.tsx` — the actual card shown on the grid (~649 lines). Receives `img, title, hp, msrp, price, motor, sharedData, onSelect`, etc. The `onSelect` plus internal `setShowDetailsSheet(true)` open the existing `MotorDetailsPremiumModal`. Both behaviors must keep firing.
- **HPMotorCard.tsx**: not currently rendered on this page (expert view only) — leave alone.
- **Search bar**: `HybridMotorSearch` + `ConfigFilterSheet` (not modified, just reparented inside new chrome).
- **Recently Viewed**: `RecentlyViewedBar` (not modified).
- **Modal**: `MotorDetailsPremiumModal` — reskin deferred to Pass 2.
- **Tokens already in `tailwind.config.ts`**: `repower-navy-900/800/700`, `repower-mercury-red.DEFAULT/deep`, `repower-gold`, `repower-cream`, `repower-paper`. Font: `font-display` = Inter Tight.

## Pass 1 — what to change

### 1. Page chrome (`MotorSelectionPage.tsx`, render block only)
- Wrap the page background in `bg-repower-paper` (replaces the `bg-stone-50` / `bg-gradient-to-b from-stone-50` blocks around the search and grid sections).
- Add a page header above the search bar, inside `max-w-[1400px] mx-auto px-6 md:px-14 pt-14`:
  - Eyebrow: small mercury-red label "Mercury Outboards" with a leading 24px hairline rule
  - H2 (`font-display font-bold text-[36px] tracking-[-0.025em] text-repower-navy-900`): "Every motor, transparently priced"
  - Meta line: `${finalFilteredMotors.length || processedMotors.length} motors · Live pricing · Built & quoted in 3 minutes` (navy-900 at 55% opacity)
- Restyle the search bar wrapper (white, hairline border, 6px radius, gold focus ring via focus-within). Keep `HybridMotorSearch` and `ConfigFilterSheet` as the inner components — only their wrapper styling changes.
- Restyle the `RecentlyViewedBar` wrapper: hairline top border, uppercase tracked label.
- Grid: keep current responsive breakpoints; just swap container background to paper, max width to 1400px.

### 2. Motor card (`MotorCardPreview.tsx`)
Rewrite the visual structure of the rendered card (the JSX from the outer wrapper through the CTA button) per the spec. Keep ALL hooks, handlers, refs, schema, modal portal, and `sharedData` wiring untouched. Specifically:

- Card container: white, `border border-[rgba(10,22,40,0.10)] rounded-lg overflow-hidden`, no shadow at rest, hover lifts `-translate-y-[3px]`, hover border `rgba(10,22,40,0.18)`, hover shadow `0 16px 40px rgba(10,22,40,0.10), 0 4px 12px rgba(10,22,40,0.05)`. Transition `cubic-bezier(0.2,0.8,0.2,1)` 0.35s.
- Image area: `aspect-[4/3]`, background `linear-gradient(135deg,#F5F1EA 0%,#ECE4D2 100%)`. Image centered, ~70% w / 75% h. Wrap image in inner div for `group-hover:scale-[1.04]` so the parent doesn't transform.
- Top tags (left): show ONE tag, priority order:
  1. **Sale**: when `dp.savingsRounded > 0` → `bg-repower-mercury-red text-white` pill, text = `$${savings.toLocaleString()} Off` (replaces current "SPECIAL PRICE" / `PopularityBadge type="special-price"`)
  2. Else **Best Seller / Popular / New 2026** from existing `getMotorPopularity(motor)` flags, styled per spec
- HP badge (top-right): `bg-repower-navy-900 text-repower-cream`, `font-display font-bold text-[14px]`, format `<strong>{hp}</strong> <span class="opacity-70 font-medium">HP</span>`. Replaces current rounded-full pill.
- Content padding `p-6` (24px).
- Title: `font-display font-semibold text-[22px] tracking-[-0.02em] leading-[1.15] text-repower-navy-900` (formatted via existing `formatTitle`).
- Model code line: existing `motor.model_number`, uppercase tracked, navy-900/45.
- Specs line: replace bullet `•` separators in `getSimplifiedSpecs()` output with styled `·` spans (navy-900/30, mx-1.5). Keep min-height for grid alignment.
- Price block — **always render all three rows** (MSRP, current, savings) using existing `dp` from `getDisplayPrices(msrp, price)`. Render MSRP row even when `dp.showMsrp` is false, falling back to a non-breaking placeholder ONLY if msrp is genuinely missing in data (log a warning so it gets fixed at the source). Current price uses `font-display font-bold text-[32px] tracking-[-0.025em]`. Savings uses uppercase tracked mercury-red, format `You Save $${savings}`.
- Trust line: hairline top border, two items with gold ✓ + uppercase tracked label. Items: `inStock ? "✓ In Stock" : "✓ Order Now"` and `"✓ 7-Yr Warranty"` (drop dynamic warranty calc into the second slot when present).
- CTA button: full-width, `bg-repower-navy-900 text-repower-cream`, uppercase tracked 0.12em, 12px, `group-hover:bg-repower-mercury-red`. Text "Build & Price" + arrow `→` on the right with `group-hover:translate-x-1`. **Keep `onClick={handleMoreInfoClick}`** — this is what opens the existing modal.
- Out of stock variant: image `grayscale-[0.5]`, HP badge dimmed, CTA becomes ghost "Notify When In Stock" (still calls `handleMoreInfoClick` so the modal still opens — wording change only). Stock text shows `ORDER NOW · 4–6 weeks` in mercury-red.
- Keep the bottom-left action cluster (Compare / Voice / Ask / Share) and Mercury logo exactly as wired today.

### 3. Loading skeleton
Update the loading branch in `MotorSelectionPage.tsx` to use paper background + cream-toned shimmer blocks matching the new card silhouette. Keep `MotorCardSkeleton` count.

### 4. Empty state
Replace the existing "No motors match your current filters" block with a centered cream-bordered card: Inter Tight headline + Inter body + mercury-red "Clear Filters" button (calls existing `setSearchQuery('')` and clears `configFilters`).

## Pass 2 — deferred (will plan separately after Pass 1 review)

- Restyle `MotorDetailsPremiumModal` (header, form fields, buttons, step indicator) per the spec.
- Polish responsive breakpoints below 640px.

## Hard guarantees

- No edits to: data hooks (`loadData`, `useGroupedMotors`, `useMotorComparison`, `useFavoriteMotors`, `useRecentlyViewed`, `useActivePromotions`), filter/search state, voice event listeners, deep-link `searchParams` logic, `MotorConfiguratorModal` open/close wiring, `MotorDetailsPremiumModal` (Pass 2), schema/SEO blocks, routing.
- No new image fetching or regeneration.
- Card grid order, count, pagination unchanged.
- The CTA on each card continues to call `handleMoreInfoClick` → opens `MotorDetailsPremiumModal` exactly as today. The card-body click continues to call `handleCardClick` → same modal.

## Files touched

- `src/pages/quote/MotorSelectionPage.tsx` — chrome, header, search/recents wrapper styles, loading + empty states
- `src/components/motors/MotorCardPreview.tsx` — card visual rewrite (handlers preserved)

No new files, no new dependencies.
