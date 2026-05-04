## Goal

Rotate the homepage hero (`HeroRepower` on `/`) across 7 cohesive copy sets — current baseline + 6 new variations from `landing_page_content.md`, each paired with the recommended CTA from `Landing_CTA.md`. One variation per visitor, stable for the session, so a customer never sees the heading flip mid-scroll.

## Variation set (cohesive bundles)

Each bundle = heading (with optional red-accent word), subheading, 3 stats, primary CTA label.

1. **Baseline** — *Keep your boat. Get your weekends back.* / New motor. Same boat. Way better mornings. / 70% benefit · 30% cost · 79 years on the water / `Build My Quote`
2. **Math** — *Your boat isn't the problem. Your motor is.* / fraction of a new boat… / Save up to 70% vs. new · Quote in 3 minutes · Real CAD prices / `See How Much I'd Save`
3. **Season** — *This season deserves a motor that keeps up.* / Stop nursing an old engine… / 1–3 day install · 7-year warranty · On Rice Lake since 1947 / `Get My Quote Before the Season Starts`
4. **Frustration** — *Tired of watching other boats pull away?* / Modern Mercury power… / 295 Google reviews · 4.6 stars · Mercury Platinum Dealer / `See My Mercury Price`
5. **Legacy** — *Three generations. One Mercury dealer.* / Jim Harris started rigging Mercurys… / Family-owned since 1947 · Mercury Certified · CSI Award Winner / `Get a Quote — No Obligation`
6. **No-BS** — *See your real Mercury price before you call anyone.* / Live CAD pricing… / Price you see = price you pay · Trade-in estimate included · Financing in minutes / `Show Me Real Prices`
7. **Emotional** — *You've had good years on that boat. Have more.* / A repower gives you a nearly new experience… / 70% of the benefit · 30% of the cost · Done in 1–3 days / `Repower My Boat`

(Per the "My"-pronoun A/B tip, baseline CTA upgraded from "Build Your Quote" → "Build My Quote".)

## Selection logic

- On first hero render, pick a variation index `0–6` and persist to `sessionStorage` under `hero-variant`.
- Reuse on subsequent renders within the same tab session, so the hero is stable while the user scrolls/navigates.
- A new tab/session = new random pick.
- Weighting: uniform for now (easy to switch to weighted later).
- **Query-string override** for testing/marketing: `?v=2` forces variation 2 and persists it for that session. Useful for ad-campaign deep links.

## Technical implementation

Single file change: `src/components/repower/HeroRepower.tsx`.

```text
src/components/repower/
  HeroRepower.tsx        ← reads variation, renders dynamic copy
  heroVariations.ts      ← NEW: typed array of 7 bundles
```

1. **`heroVariations.ts`** — exports `HERO_VARIATIONS: HeroVariation[]` with shape:
   ```ts
   { id: string; eyebrow?: string; heading: ReactNode; subheading: string;
     stats: { n: string; l: string }[]; ctaLabel: string }
   ```
   `heading` supports the red-accent word via a small `<span>` (e.g. `weekends`). For variations without a natural accent word, no span is used.

2. **`HeroRepower.tsx`**:
   - Add `useMemo` selector that:
     - reads `?v=N` from `window.location.search`; if valid index, use + persist.
     - else reads `sessionStorage.getItem('hero-variant')`; if valid, use.
     - else `Math.floor(Math.random() * HERO_VARIATIONS.length)`, persist.
   - Render `variation.eyebrow ?? 'Mercury Repower · Rice Lake · Since 1947'`, `variation.heading`, `variation.subheading`, `.map` over `variation.stats`, and use `variation.ctaLabel` as the primary button text.
   - Keep all existing animations, motion timings, classes, video background, and phone CTA untouched.
   - SSR/prerender safety: default to baseline (index 0) until `useEffect` hydration sets the chosen variant — prevents hydration mismatch in static prerender.

3. **No tracking added** (per "rotation system, no A/B"). Easy hook point left for analytics later: a single `data-hero-variant` attribute on the `<section>` so any future analytics can filter without code changes.

## Out of scope

- A/B test logging, conversion attribution, admin picker UI — can be layered on later.
- Other heros (`RepowerHero` on `/repower`) untouched unless you ask.
- No memory file added; this is content config, not a project rule.

## Verification

After implementation:
1. Load `/` several times in a fresh tab (or clear sessionStorage) — should see different headings/subs/stats/CTA cycling.
2. Within one tab, refresh — same variation persists.
3. Visit `/?v=3` — frustration variation appears; refresh keeps it.
4. Visit `/?v=99` — falls back to random.
5. Confirm baseline still renders correctly with the red `weekends` accent.
