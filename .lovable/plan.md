# Cinematic Intro — Style Refinement

Goal: bring `src/components/quote-builder/QuoteRevealCinematic.tsx` up to the same higher-grade visual register as the rest of the site (Repower hero, Motor Selection page, design-token system). No copy changes, no animation timing changes, no stage logic changes, no layout repositioning. Pure typography + finish.

## Scope

Single file: `src/components/quote-builder/QuoteRevealCinematic.tsx`.

## What the site looks like now (reference)

- Display type: `font-display` (Inter Tight), tight tracking (`-0.025em` to `-0.03em`), heavy weight for hero numerals.
- Eyebrow type: Inter 11–12px, semibold, uppercase, `letter-spacing: 0.22em`, paired with a thin hairline rule.
- Color story: navy-900 on cream, with `repower-gold` (subtle champagne hairline) and `repower-mercury-red` reserved for accents/eyebrows.
- Restrained finishes: hairline dividers, small framed "stat" pills, no neon, no bright emerald green, no heavy yellow gold.

## What the cinematic looks like now (the gap)

- Uses `font-outfit` everywhere — feels lighter/rounder than the new `font-display` (Inter Tight).
- Bright yellow `#D4AF37` / `--promo-gold-1` glow, breathing brightness, large blurred radial glow disc behind the price.
- Emerald `#10B981 → #059669` "Save X%" pill with neon shadow — clashes with the refined palette.
- Generic Tailwind grays (`#6B7280`, `#9CA3AF`, `#E5E7EB`) instead of the muted navy/cream-on-dark tokens the rest of the site uses.
- Sparkles icons scattered through eyebrows.
- Hairline accent is a yellow gold gradient line.

## Proposed refinement

Typography
- Swap `font-outfit` → `font-display` everywhere in this file (motor name H2, MSRP value, price numerals, detail values).
- Tighten tracking on the price numerals (`tracking-tight` → explicit `letter-spacing: -0.03em`) to match the hero treatment.
- Standardize all eyebrow labels (Your Price, MSRP, Total Savings, Coverage, Your Bonus, Authorized Dealer) on Inter 10–11px, `font-medium`, `letter-spacing: 0.22em` — one consistent eyebrow recipe instead of three close variants.
- Motor name: keep position, but switch to `font-display`, medium weight, slightly tighter tracking, drop the gold textShadow to a subtle neutral one.

Color & finish
- Replace the bright yellow gold (`#D4AF37`, `--promo-gold-1`) used on the price text, glow, hairline, and bonus value with a restrained champagne/cream tone — a single muted warm token, used sparingly. The price reads as luminous off-white with a subtle warm halo, not "gold leaf."
- Tone down the breathing glow: smaller radius, lower opacity, slower cycle (visual register only, not timing of the reveal stages).
- "Save X%" badge: drop the emerald gradient + colored shadow; render as a small framed pill with a hairline border and warm-cream text, matching the 70% / 30% pill on the Repower hero.
- Swap raw hex grays for a small set of dark-mode neutrals applied via inline style (since this overlay lives outside the cream-paper surface system): a single ink-on-dark scale (e.g. high / mid / low contrast white) so labels, values, and helper text feel like one family.
- Replace the yellow-gold hairline accent below the price with a thin warm-cream hairline (`linear-gradient(90deg, transparent, rgba(245,241,234,0.35), transparent)`).
- Remove decorative `Sparkles` icons from eyebrows (keep `Shield` on Coverage). Eyebrows become pure type + hairline, matching the rest of the site.
- Progress bar at the bottom: switch from yellow-gold gradient to the same warm-cream hairline tone at low opacity.

Out of scope (not touching)
- Stage timeline, durations, sound cues, haptics, confetti trigger, skip behavior, tap-to-skip, iOS guards.
- Component positioning percentages, image sizing, Mercury logo placement.
- Any other file. No token additions to `index.css` or `tailwind.config.ts` — all values applied locally to this overlay since it's a one-off dark cinematic context.

## Acceptance

- All text in the overlay uses `font-display` (or Inter for eyebrows) — no `font-outfit` references remain in this file.
- No bright yellow gold (`#D4AF37`, `#FFD700`, `--promo-gold-1`) used on text, glow, or hairline. Confetti color palette can stay as the celebratory burst.
- No emerald green pill; savings badge reads as a refined hairline-framed chip.
- Eyebrows share one consistent recipe; Sparkles icons removed from eyebrow rows.
- Visual feel matches `RepowerHero` and the Motor Selection H1/subhead pairing — restrained, editorial, high-grade — while remaining a dark cinematic moment.
