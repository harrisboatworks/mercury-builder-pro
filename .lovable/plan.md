# /repower Pass 2 — Restyle Plan

Scope: bring the remaining old-styled sections into the locked design system (white/cream/navy surfaces, hairline borders, Inter Tight headlines, Inter body, mercury-red eyebrows, gold accents). No copy, math, or behavior changes. No SEO/meta/schema changes.

## Files to edit

1. `src/pages/Repower.tsx`
2. `src/components/repower/WinterPro.tsx`
3. `src/components/repower/RepowerROICalculator.tsx`

No new files; the infographic replacement is built inline as 4 native sections in `Repower.tsx`.

---

## 1. Symptoms of an Aging Motor (Repower.tsx, ~line 66 block)

Already mostly on system. Tighten:
- Keep white card, hairline `border-repower-navy-900/10`, `rounded-none` to match rest of page.
- Icon: `AlertTriangle` in `text-repower-mercury-red`, no circle (already correct).
- Title: `font-display font-semibold` (Inter Tight), body `font-sans` (Inter).
- Grid: `md:grid-cols-2 lg:grid-cols-4 gap-px bg-repower-navy-900/10` style or keep `gap-6` — match the rest of site (use `gap-6` like FourStroke grid).

## 2. "One More Season Trap" callout (Repower.tsx ~line 96)

Currently a left gold border on paper bg. Restyle to:
- `bg-repower-cream border-l-2 border-repower-gold p-8 md:p-10`
- Eyebrow gold uppercase tracked, body navy.
- Add small `AlertTriangle` icon in `text-repower-gold` (no circle) before eyebrow.

## 3. Repower or Buy New comparison (Repower.tsx ~line 108)

Currently navy section. Convert to paper section with two cream/paper cards:
- Section bg: `bg-repower-paper text-repower-navy-900` (match other content sections).
- Both columns: `bg-repower-cream border border-repower-navy-900/10 rounded-none p-8 md:p-10`.
- Replace `✓` text marker with `<Check>` icon in `text-repower-gold w-4 h-4`.
- Replace `·` marker with `<X>` icon in `text-repower-navy-900/50 w-4 h-4`.
- Eyebrows stay (gold for Repower, navy/55 for Buy New). Headers Inter Tight, body Inter.

## 4. FourStroke Benefits — "Not a replacement. A revolution." (Repower.tsx ~line 166)

Convert 3-card grid into 3-stat anchor grid:
- Each cell: large `font-display font-bold text-repower-mercury-red text-[clamp(40px,5vw,64px)]` extracting numeric anchor from title (`30-40%`, `Whisper`, `Instant`). Where there is no number, use the icon glyph as the anchor — instead, restructure: keep the icon small at top in mercury-red, then keep title as Inter Tight 700, body Inter. The "stat anchor" treatment here means the **title is the anchor in mercury-red** (pulling the % or word out is risky given the copy lock). Implementation: render title as `font-display font-bold text-[clamp(28px,3vw,40px)] text-repower-mercury-red` with description below in `font-sans text-repower-navy-900/65`.
- Remove white card chrome; use hairline divider grid (`divide-x divide-y divide-repower-navy-900/10` on a 3-col grid, no individual card borders) — matches "more than a replacement" stat treatment elsewhere.
- SmartCraft callout below: `bg-repower-cream border-l-2 border-repower-gold` (no white box), Mercury logo + Inter Tight title + Inter body.

## 5. Infographic replacement (Repower.tsx ~line 209)

Remove `<ExpandableImage>` PNG block. Build 4 stacked native sub-sections inside the same outer navy section, each with eyebrow + Inter Tight headline + Inter body + real lucide icon in brand color. Add fade-up via existing `motion-safe` Tailwind utility (`motion-safe:animate-fade-in` or simple `opacity-0 translate-y-4` with `IntersectionObserver` — use the simplest CSS-only `motion-safe:animate-fade-in` from existing Tailwind config; if not present, use `transition-opacity` with no JS, or `framer-motion` `whileInView` consistent with site).

Subsections (content from existing infographic):
1. **The Problem** — `AlertTriangle` icon (mercury-red), eyebrow "The Problem", H3 "Your motor is costing you more than money.", body summarizing aging-motor pain.
2. **The Solution** — `Wrench` icon (gold), eyebrow "The Solution", H3 "Repower with Mercury.", body about modern tech.
3. **The Math** — `BadgeCheck` icon (gold), eyebrow "The Math", H3 "70% of the benefit. 30% of the cost.", body referencing $8k–$18k vs $35k–$70k new.
4. **The Steps** — numbered 01–04 mini list mirroring `RepowerProcess` 4 steps in compact form.

Keep the "Download Full Guide (PDF)" button below the 4 sections, restyled as outline button.

## 6. Pricing section "$8,000 to $18,000" callout (Repower.tsx ~line 274)

Already cream + gold border. Tighten:
- Remove `border-repower-gold/40` full border, replace with `border-l-2 border-repower-gold` only, left-aligned content.
- Anchor `$8,000 to $18,000` stays Inter Tight 700; eyebrow mercury-red uppercase tracked; supporting line Inter body navy/65.
- `rounded-none`.

## 7. WinterPro panel (WinterPro.tsx)

Convert from paper bg with navy snowflake circle → solid navy panel with gold accents:
- Section bg: `bg-repower-navy-900 text-repower-cream`.
- Snowflake: `text-repower-gold w-10 h-10`, no circle wrapper.
- Eyebrow `text-repower-gold` uppercase tracked.
- H2 in cream with mercury-red italic accent word ("winter").
- Convert benefits list to bulleted list with gold `Check` icons (replace the 12-col baseline grid).

## 8. Cost Calculator (RepowerROICalculator.tsx)

Inputs adopt quote-builder form-field system:
- Wrap each control in a structure mirroring `QuoteFormField` (label + control + helper). Use the `quoteInputClass` look for any text input. Since this calculator has no text input (only pills, radios, slider), apply equivalent treatment:
  - HP pills: keep but adopt `border border-repower-navy-900/15`, selected → `bg-repower-navy-900 text-repower-cream`. (Already close.)
  - Rigging: convert RadioGroup rows to **radio cards** — each option a bordered cell `border border-repower-navy-900/10 bg-white p-4 rounded-none`, selected → `border-repower-gold bg-repower-gold/[0.04]`.
  - Slider: keep but use cream track via existing slider tokens.
- Right-side results panel: change from `bg-repower-navy-900` slab → `bg-repower-cream border border-repower-navy-900/10 rounded-none`.
  - Total uses `font-display font-bold text-[clamp(36px,4vw,56px)] text-repower-navy-900` as anchor.
  - Savings line: `font-sans text-xs uppercase tracking-[0.18em] text-repower-mercury-red`.
  - Per-card breakdown: hairline borders, navy text, gold "Best Value" tag.
- All math, state, and CTA logic untouched.

---

## Hard rules enforced

- No em dashes anywhere (use commas / periods / "to").
- No Tailwind default colors — only `repower-*` tokens and brand hexes.
- No icons in colored circle backgrounds — all icons inline, sized with `w-* h-*`, color via brand token.
- Zero copy, calculator math, FAQ logic, or video changes.
- SEO components, meta tags, JSON-LD untouched.

## Out of scope (Pass 3, awaiting approval)

- FAQ accordion restyle
- WhyHarrisRepower pillars
- Testimonials section
- Service Area chips
