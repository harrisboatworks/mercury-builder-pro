
# /repower Restyle — Audit & Phase 1 Plan

Per the brief: surgical reskin of `/repower` only. No changes to `/quote/*`, pricing, financing, motor data, global Header/Footer, or any other route.

## A. Audit of current `/repower`

**File:** `src/pages/Repower.tsx` (552 lines).

**Components currently used:**
- `LuxuryHeader` (global header — will not modify; will wrap with transparent-over-hero behavior via per-page state, not by editing the component)
- `RepowerPageSEO` (keep)
- `RepowerFAQ` (`src/components/repower/RepowerFAQ.tsx` — keep, restyle wrapper)
- `RepowerGuideDownloadDialog` (keep)
- `RepowerROICalculator` (exists in `src/components/repower/` — the cost calculator; keep, restyle wrapper)
- `ExpandableImage` for the infographic PNG (keep)
- shadcn `Button`, lucide icons

**Existing sections on the page (in order):**
1. Hero (Mercury Certified Repower Center logo, H1, 70%/30% pill, 3 CTAs)
2. Warning Signs (Hard Starting / Smoke / Loss of Power / Frequent Repairs) + "One More Season Trap" amber callout
3. YouTube video
4. Repower vs Buy New (two-column compare)
5. Modern Technology Benefits (3 cards) + SmartCraft blue panel
6. Infographic PNG + "Download Full Repower Guide"
7. Transparent Pricing (3 cost cards + "$8,000–$18,000" callout + HP cost table)
8. (further down) ROI calculator, Why Harris pillars, Repower Process, FAQ, Testimonials, final CTA

**Existing brand assets found in project (will be reused — not regenerated):**
- Mercury Certified Repower Center logo: `/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png` (currently in hero)
- Mercury logo: `src/assets/mercury-logo.png`
- HBW logo lockups: `src/assets/harris-logo.png`, `harris-logo-black.png`, `harris-logo-white.png`, `harris-logo-original.png`
- 7-Year Warranty mark: `src/assets/harris-7-year-warranty.png`
- Pro XS logo: `src/assets/pro-xs-logo.png`
- Hero photography on hand: `landing-hero-mercury.jpg`, `hero-proxs-sunset.jpg`, `landing-cta-lake.jpg`
- Infographic: `public/repower-assets/hbw-repower-infographic.png`

**Not found in repo (will need to be added later, or substituted):**
- Standalone "Mercury Platinum Dealer" badge image
- Standalone "CSI Award" badge image
  → For Phase 1's TrustStrip I will use the assets we *do* have (Repower Center logo, Mercury wordmark, 7-Year Warranty mark, HBW Since 1947 lockup) and a clean text + lucide-icon treatment for "Mercury Platinum Dealer" and "CSI Award" until you provide the real badge files. No invented circle/letter graphics.

**Copy that will be reused verbatim** (from current page):
- Headline "Mercury Outboard Repower" / "Keep Your Boat. Upgrade Your Engine." + 70%/30%
- All four warning-sign cards
- "Avoid the One More Season Trap" body copy
- Repower vs New comparison bullets
- "Transparent Pricing" 3-card breakdown + "Typical Rice Lake Repower $8,000–$18,000"
- HP cost table
- All FAQ Q&A inside `RepowerFAQ`
- "Build Your Quote" → `/quote/motor-selection`, phone `(905) 342-2153`
- Existing ROI calculator logic (presentation only, not logic)

## B. What's new vs. restyled vs. left alone

| Status | Item |
|---|---|
| **New (Phase 1)** | Tailwind theme extension (navy/mercury-red/gold/cream/paper), Inter Tight + Inter fonts, `repowerImages.ts` constants file, `HeroRepower.tsx`, `TrustStrip.tsx`, `RepowerMath.tsx`, `RepowerLayout.tsx` (transparent-header behavior scoped to /repower) |
| **New (Phase 2)** | `WhyHarrisRepower.tsx`, `RepowerProcess.tsx`, `WinterPro.tsx`, `FinalCTARepower.tsx`, restyled FAQ wrapper, floating sticky "Build Your Quote" CTA |
| **Restyled wrapper** | Existing `RepowerFAQ`, existing `RepowerROICalculator`, infographic section, HP cost table, Warning Signs grid, Repower-vs-New compare, Transparent Pricing 3-card block |
| **Left alone** | `LuxuryHeader` source, `RepowerPageSEO`, `RepowerGuideDownloadDialog`, all `/quote/*` code, pricing/financing/inventory, Footer, every other route |

## C. Mapping existing sections into the new visual rhythm

```
1. HeroRepower                  ← replaces current hero
2. TrustStrip                   ← NEW row of credentials
3. RepowerMath                  ← NEW 70%/30% feature, absorbs hero pill
4. WarningSigns (restyled)      ← keep current 4 cards + "One More Season"
5. RepowerVsNew (restyled)      ← keep two-column compare
6. ModernBenefits (restyled)    ← keep 3 cards + SmartCraft, no blue panel
7. WhyHarrisRepower             ← NEW 4-pillar
8. RepowerProcess               ← NEW 4 steps (uses existing repowerStepsData)
9. ROI Calculator (restyled)    ← existing component, new shell
10. Transparent Pricing + HP table (restyled)  ← keep all data
11. Infographic + Guide download (restyled)
12. Video (restyled)
13. WinterPro                   ← NEW pro tip section
14. RepowerFAQ (restyled)       ← reuse all Q&A
15. FinalCTA                    ← NEW closing hero
```

## D. Phase 1 deliverables (this approval)

1. **Extend Tailwind theme** in `tailwind.config.ts` — add `repower-navy-900/800/700`, `repower-mercury-red`, `repower-mercury-red-deep`, `repower-gold`, `repower-cream`, `repower-paper`. Add `font-display` (Inter Tight) and keep existing `font-sans` mapped to Inter for the repower components. Existing tokens untouched.
2. **Add Google Fonts** to `index.html` (`Inter Tight` 400-800, `Inter` 300-700) — preconnect + display=swap.
3. **Create `src/components/repower/repowerImages.ts`** — single source for hero photo URLs (Unsplash placeholders per brief) and brand asset paths.
4. **Create `src/components/repower/HeroRepower.tsx`** — full-bleed 100vh, photo bg with slow zoom-out, dark gradient overlay, eyebrow + H1 + subhead + 3-stat row + dual CTA (Build Your Quote → `/quote/motor-selection`, tel:9053422153) + scroll cue. Staggered fade-up via framer-motion (already installed). Will render BOTH heading treatments side-by-side via a `?headline=a|b` query param so you can pick before we commit.
5. **Create `src/components/repower/TrustStrip.tsx`** — navy-900 band, 5 items using real assets we have + clean text-mark for the two badges we don't yet have. Mobile wraps to 2-3 rows.
6. **Create `src/components/repower/RepowerMath.tsx`** — paper bg, navy gradient card with giant 70% / 30%, three stat blocks on right (30-40% / $8-18k / 1-2 days). Pulls verbatim copy from current hero pill + pricing callout.
7. **Create `src/components/repower/RepowerLayout.tsx`** — wraps children, manages scroll-state to toggle `LuxuryHeader` between transparent and solid navy via a CSS class on the page root. Does NOT modify `LuxuryHeader` source.
8. **Edit `src/pages/Repower.tsx`** — wrap in `RepowerLayout`, render `HeroRepower` + `TrustStrip` + `RepowerMath` at the top, keep all existing sections below them untouched for now (so nothing regresses while you review). The old hero JSX will be commented out at the bottom of the file as the brief requests.

## E. Explicitly NOT doing in Phase 1
- No edits to `LuxuryHeader`, Footer, routing, SEO components, quote builder, pricing, financing, motor data, FAQ data.
- Not regenerating any logo or badge.
- Not deleting any existing component.
- Not touching Phase 2 sections yet.

## F. Open questions before I build (will use defaults if you don't answer)
1. **Hero headline:** brief offers two — original ("Mercury Outboard Repower" + "Keep Your Boat…") or new ("Keep your boat. Get your weekends back."). **Default:** render both behind a query param toggle so you can A/B in preview.
2. **Missing Platinum Dealer + CSI Award badges:** **Default:** clean type lockup with a small lucide `Award`/`BadgeCheck` icon in gold, sized to match other logos. Drop in real PNGs later by editing `repowerImages.ts` only.
3. **Header transparency:** brief says transparent over hero → solid navy on scroll. `LuxuryHeader` is shared, so I'll do this with a wrapper that adds a `data-repower-transparent` attribute and a few targeted CSS rules in a `repower.css` file scoped under that attribute. **No changes to the Header component itself.**

After Phase 1 is approved and looks right in preview, Phase 2 builds sections 7/8/13/15 + sticky CTA + responsive polish.
