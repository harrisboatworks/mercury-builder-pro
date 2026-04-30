## Scope guarantees (will NOT change)

- No Supabase RLS, schema, Edge Functions, auth, pricing math, inventory inclusion/exclusion, sitemap or markdown twin generation, MCP/agent endpoints, public API contracts.
- No change to the 24 public motor listing strategy.
- No invented specs. Motor detail page continues to read specs from the DB row exactly as today.
- Harris Boat Works positioning preserved (Mercury Platinum dealer, Gores Landing pickup-only, family-owned 1947, dealer since 1965, real CAD pricing).

This is a small, visual/UX-only pass on three surfaces.

---

## 1. Mobile homepage — first viewport (`src/pages/Index.tsx`)

Problem: on a ~390px viewport the hero stacks image first, then a long Badge → H1 → 3-line subhead → primary CTA → secondary CTA → 4-chip trust row. The "Build Your Quote" button sits well below the fold.

Changes (mobile-only, desktop untouched):

- Tighten hero vertical rhythm on `< md`: reduce `py-12` → `py-6`, `mb-5` → `mb-3`, subhead `mb-8` → `mb-5`.
- Shrink hero image aspect on mobile from `aspect-[4/3]` to `aspect-[16/10]` so the H1 + CTA land in the first viewport.
- Trim the mobile subhead to one line of value + one line of trust ("Live CAD pricing. Pickup in Gores Landing. ~3 minutes."). Keep the longer version on `md+`.
- Primary CTA: add a small subline under the button on mobile only — "No forms. No sales calls." — and keep the existing `goBuild` handler.
- Move the secondary CTA (Phone / Saved Quotes) below the trust row on mobile so it stops competing with the primary action.
- Trust row on mobile: collapse 4 chips to 2 most credible ones ("Mercury Platinum Dealer · Family-owned since 1947") + the Google rating badge. Full 4 chips remain on `md+`.

No copy invented beyond the boundaries above; everything is already true on the site.

---

## 2. Mobile motor selection — reduce CTA crowding (`src/components/quote-builder/MotorSelection.tsx`)

Current mobile stack creates 3–4 simultaneous floating elements:

```text
[ sticky search bar ]            top
   ... motor cards ...
[ AIChatButton (global) ]        bottom-right, fixed
[ MobileStickyCTA quote button ] bottom-right, fixed   <-- overlaps chat
[ Sticky bottom price bar ]      bottom, full-width    <-- when motor selected
```

The `MobileStickyCTA` (floating "Get a Quote" pill) and `AIChatButton` both sit at `bottom-4 right-4 z-40/50` and visually collide. When a motor is selected, the bottom price bar adds a third layer.

Changes:

- Remove the `MobileStickyCTA` from `MotorSelection` only. The sticky bottom price bar already provides the primary "Continue" CTA the moment the user picks a motor, and every motor card has its own quote button. The floating pill is redundant and the source of the crowding.
- Keep `MobileStickyCTA` available for other pages that import it — only the mount inside `MotorSelection.tsx` (~line 2060) is removed.
- Keep the global `AIChatButton`/`GlobalAIChat` as-is, but on this page only, raise the bottom price bar's safe-area padding so the chat bubble doesn't tuck under it. Add `pb-[env(safe-area-inset-bottom)]` to the price bar container.
- Sticky search bar stays; reduce its vertical padding on mobile from `p-3` to `px-3 py-2` to claw back ~12px of viewport.
- Mobile spacer (`.mobile-cta-spacer`) — keep, but gate it so it only adds height when the bottom price bar is actually visible (i.e. when a motor is selected). Currently it always reserves space.

Result: at most one floating action (chat) plus the contextual bottom price bar when a motor is selected. No floating pill collision.

---

## 3. Motor detail page — premium + trust polish (`src/pages/MotorPage.tsx`)

Current page is functional but reads as a thin record view: H1, image, price, raw spec table, single CTA, prose.

Changes (no spec invention — every value already comes from the DB row or from existing site facts):

a. **Header band**: wrap `<header>` in a subtle bordered card; add a small Mercury family chip (Pro XS / FourStroke / SeaPro) next to the H1 using the existing `family` value. Add a "Mercury Platinum Dealer · Gores Landing, ON" eyebrow above the H1.

b. **Price block**: reorganize the right column so price + stock + CTA are visually grouped in a card, separated from the spec table below. Add three short trust lines under the CTA, each with an existing-site icon:
   - "Real CAD pricing — no hidden fees"
   - "Pickup at Gores Landing, ON (no shipping)"
   - "3-year Mercury factory warranty included"

   These lines are already true and already implied elsewhere on the site; the page just makes them explicit at the decision point.

c. **Spec table provenance**: add a small footer line under the spec table — "Specifications from Mercury Marine official brochures." No new spec rows are added, no values are altered. This is the provenance line you asked for.

d. **Trust strip below the fold**: a single horizontal strip with four short modules (existing facts only):
   - Mercury Marine Platinum Dealer
   - Family-owned since 1947 · Mercury dealer since 1965
   - Serving Toronto, GTA, Peterborough, Kawarthas
   - Quote-builder in ~3 minutes, live CAD pricing

e. **Secondary CTA**: keep the existing inline "Start your quote →" link, but add a sticky-on-mobile bottom bar mirroring the price + "Build a Quote" button so users scrolling the prose section can convert without scrolling back up. Desktop unchanged.

f. **Breadcrumb + nav**: leave structure intact; only add `aria-current="page"` on the trailing crumb for a11y.

No JSON-LD, canonical, prerender, or routing logic is touched. The static prerender output remains the source of truth for crawlers.

---

## 4. Trust/proof modules (small, reusable)

Add one new presentational component, used by both the homepage hero trust row and the motor detail trust strip:

- `src/components/trust/DealerTrustStrip.tsx` — pure presentational, no data fetching. Props: `variant: 'compact' | 'full'`. Renders the four trust facts above using existing `lucide-react` icons. No new images, no new copy beyond the verified facts.

This gives us one place to maintain trust copy and keeps both surfaces consistent.

---

## 5. What stays exactly the same

- All routes, lazy boundaries, prerender, sitemap, markdown twins.
- All quote-flow logic, pricing, trade-in, financing, deposits.
- Global chat (`GlobalAIChat`, `AIChatButton`), voice context, ElevenLabs hooks.
- `MobileStickyCTA` component itself (still used elsewhere).
- All Supabase queries in `MotorPage.tsx` (`MOTOR_SELECT`, fuzzy resolver, agent event tracking).
- Desktop layouts on all three surfaces.

---

## Files touched

- `src/pages/Index.tsx` — mobile hero spacing, copy trim, trust-row variant.
- `src/components/quote-builder/MotorSelection.tsx` — remove the in-page `MobileStickyCTA` mount; tighten sticky search padding; gate spacer.
- `src/pages/MotorPage.tsx` — header eyebrow, price card, trust lines under CTA, spec provenance footer, trust strip, mobile sticky bottom bar.
- `src/components/trust/DealerTrustStrip.tsx` — new, small presentational component.

Estimated diff: ~300 lines across 4 files, no new dependencies.

---

## Review checklist after implementation

1. Mobile (390×844): screenshot homepage first viewport — H1 + primary CTA + at least one trust signal must be visible without scrolling.
2. Mobile motor selection: screenshot with no motor selected (only chat bubble visible at bottom-right) and with a motor selected (price bar + chat, no overlap).
3. Motor detail (e.g. `/motors/proxs-200hp-200-elpt-proxs`): screenshot desktop and mobile showing the new price card, trust lines, and provenance footer.
4. Confirm desktop hero, desktop motor grid, and desktop motor detail look unchanged.