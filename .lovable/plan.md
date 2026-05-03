## Motor Selection Page Cleanup

### 1. Use the same header wrapper as the home page

`src/pages/Index.tsx` uses `<RepowerLayout>`, which renders `<RepowerHeader />` (no `solid` prop, full scroll-fade behavior). The motor selection page currently uses `<RepowerHeader solid />` directly. Both render the same nav links and `xl:` (1280px) breakpoint for hamburger.

Note: the user spec asks for a 1024px (`lg:`) breakpoint. The current `RepowerHeader` uses `xl:` (1280px) for the desktop nav. We will change `RepowerHeader` so the nav appears at `lg:` (1024px) — this updates every page consistently.

Changes in `src/pages/quote/MotorSelectionPage.tsx`:
- Replace `<RepowerHeader solid />` (both loading and main return) with `<RepowerHeader />` so scroll-fade behavior matches the home page.
- Remove the `pt-[88px]` `<main>` spacer — `RepowerLayout` does not add one and the home page lets the hero sit under the transparent header. For the motor selection (non-hero) page we instead use `pt-20` (80px) so content clears the fixed header but doesn't leave a big gap.
- Drop the `RepowerHeader` import in favor of wrapping the page in `<RepowerLayout>` for full parity with home.

Changes in `src/components/repower/RepowerHeader.tsx`:
- Swap `hidden xl:flex` → `hidden lg:flex` on the desktop `<nav>`.
- Swap `xl:hidden` → `lg:hidden` on the hamburger button.
- Swap `hidden xl:inline-flex` → `hidden lg:inline-flex` on the Sign In button.

### 2. Rework the page heading into a browse-page header

In `src/pages/quote/MotorSelectionPage.tsx`, replace lines ~961-977 with:

- Container padding: `pt-14 pb-6` (instead of `pt-10 md:pt-14 pb-2`).
- Eyebrow: keep the red rule + "IN-STOCK MERCURY OUTBOARDS" text.
- H1: `text-[36px] md:text-[48px] font-display font-bold tracking-[-0.025em] text-repower-navy-900` → "Choose your power."
- Subhead: `mt-3 text-[18px] text-repower-navy-900/65 max-w-[60ch]` → `{count} motors in stock. Live pricing, transparent quotes, financing from $50/wk. Build yours in three minutes.`

`{count}` uses `(finalFilteredMotors.length || processedMotors.length).toLocaleString()`.

### 3. Restore the search placeholder

In `src/components/motors/HybridMotorSearch.tsx`:
- Replace the `PLACEHOLDER_PHRASES` cycling overlay (lines ~566-593) with a single static placeholder: "Search motors by HP, model, or feature…", styled `text-[15px] text-repower-navy-900/40 font-normal` (Inter via default sans).
- Drop the blinking cursor span.
- Keep the `<input>` itself (mic + filter icons positioned around it remain unchanged).
- Leave the listening-state overlay intact.

### 4. Redesign the promo banner

Rewrite `PromoBannerConditional` in `src/pages/quote/MotorSelectionPage.tsx` as a custom strip (no `DismissibleBanner`):

```text
[ navy-900 strip, gold/25 hairline top+bottom, h-14 desktop ]
[ max-w-[1400px], px-14, flex items-center justify-between ]
  Left:  [7-year badge img h-8] · "Get 7 Years of Zero-Worry Boating" · "Ends May 17, 2026"
  Right: "LEARN MORE →"  [X dismiss]
```

- Persistence: `localStorage.getItem('promo_banner_dismissed_v2')` short-circuits render. Dismiss handler sets the key.
- Position: rendered between `<RepowerHeader>` and `<main>` content (move `<PromoBannerConditional />` from its current spot at ~line 1044 to just inside the `<main>` before `VoiceStatusBanner`, full-width).
- Mobile (`<700px`): switch to `flex-col` with stacked text + button via `sm:flex-row` (Tailwind 640px breakpoint, close enough to spec).
- Typography:
  - Title: `font-semibold text-[14px] text-repower-cream`
  - Date: `text-[13px] text-repower-cream/60`, separated by gold middot `<span class="text-repower-gold mx-2">·</span>`
  - Learn More: `text-[13px] font-semibold uppercase tracking-[0.12em] text-repower-gold` with arrow translating `group-hover:translate-x-1`
  - Dismiss: ghost `Button` with `X` icon, `text-repower-cream/60 hover:text-repower-cream`
- Borders: `border-y border-repower-gold/25`, background `bg-repower-navy-900`.
- Dynamic content: pull `promo.bonus_title || promo.name` for the title, format `promo.end_date` as `Ends {Month D, YYYY}`. (Hardcoded "May 17, 2026" only used as fallback if no `end_date`.)

### Files touched
- `src/pages/quote/MotorSelectionPage.tsx` (header swap, page heading, promo banner rewrite, banner repositioning)
- `src/components/repower/RepowerHeader.tsx` (xl→lg breakpoints)
- `src/components/motors/HybridMotorSearch.tsx` (static placeholder)
