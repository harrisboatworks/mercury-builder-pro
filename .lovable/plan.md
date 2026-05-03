## Phase 4 Quote Builder Redesign — Audit + Pass 1 Plan

This is a visual-only redesign. Zero changes to state, validation, routing, copy, fields, pricing, or data. All work is restricted to JSX/className surfaces and new presentational shared components.

---

### Audit: files in scope (steps 2–6 + wrapper)

**Layout wrapper (shared across all steps)**
- `src/components/quote-builder/QuoteLayout.tsx` — Wraps every step. Renders `LuxuryHeader`, `QuoteProgressStepper`, and ambient slate/blue gradient orbs. Currently uses `bg-gradient-to-br from-slate-50 via-white to-blue-50/30` (Tailwind defaults — out of palette).
- `src/components/quote-builder/QuoteProgressStepper.tsx` — Stepper strip rendered below header. 9 conditional steps total; mobile shows label + progress bar + dots; desktop shows numbered circles + connectors. Uses `primary` / `border` / `muted-foreground` tokens (off-palette for the new system).

**Step 2 — Options** (`/quote/options`)
- Page: `src/pages/quote/OptionsPage.tsx` — wraps in `QuoteLayout`, renders required/recommended/available sections, sticky desktop footer with Back / total / Continue.
- Components used: `OptionsSection` (local), `OptionCard` (local, list-tile), `VisualOptionCard` (`src/components/options/VisualOptionCard.tsx`), `OptionDetailsModal`, `BatteryOptionPrompt`, `Card`, `Badge`, `Checkbox`, `Button`.
- Form fields: none — only toggleable option tiles + the binary battery prompt.

**Step 3 — Purchase Path** (`/quote/purchase-path`)
- Page: `src/pages/quote/PurchasePathPage.tsx` (uses `QuoteLayout` + `PageTransition`).
- Component: `src/components/quote-builder/PurchasePath.tsx` — two-tile grid (Loose Motor / Professional Install) with `Package` and `Wrench` icons. No form fields.

**Step 4 — Boat Info** (`/quote/boat-info`)
- Page: `src/pages/quote/BoatInfoPage.tsx`.
- Component: `src/components/quote-builder/BoatInformation.tsx` (1022 lines). Form fields: boat type (select/cards), make, model, length, current motor brand, current HP, year, serial, control type (radio), shaft length (radio), hasBattery, hasCompatibleProp. Uses `Input`, `Label`, `Select`, `Card`, `Slider`, `Tooltip`, `Alert`, `Collapsible`, `TransomHeightCalculator`, plus optional `TradeInValuation` (only when `includeTradeIn` is true — but here always called with `includeTradeIn={false}`).

**Step 5 — Promo** (`/quote/promo-selection`)
- Page: `src/pages/quote/PromoSelectionPage.tsx` — three-option choice (no payments / special financing / cash rebate) + conditional financing rate selector. Uses framer-motion, `Button`, custom card markup with `Check`, `ArrowRight`, `Banknote`, `Percent`, `CalendarOff`, `Shield` icons, `CountdownTimer`.

**Step 6 — Summary** (`/quote/summary`)
- Page: `src/pages/quote/QuoteSummaryPage.tsx` (1221 lines).
- Components: `PricingTable`, `BonusOffers`, `StickySummary`, `QuoteRevealCinematic`, `SaveQuoteDialog`, `SaveQuoteWithAuth`, `PhoneCapture`, `DepositInfoDialog`, `StaleQuoteAlert`, `AdminQuoteControls`, `QuoteSummarySkeleton`. Lots of CTAs (PDF, deposit, save, schedule).

**Other steps in flow but out of Phase 4 scope per request** (still rendered through `QuoteLayout`, so the new stepper/header will affect them visually): TradeIn, FuelTank, Installation, MotorSelection, Schedule, Success. We will not touch their content; only the wrapper they share is upgraded.

---

### Shared design primitives to create

All new files live under `src/components/quote-builder/redesign/`:

1. `QuotePageShell.tsx` — Wraps each step's content. Props: `eyebrow`, `title`, `subhead?`, `children`. Renders paper bg, max-width 880px, `py-12 px-6 md:py-16 md:px-0`, eyebrow (mercury-red uppercase + leading hairline), H1 (Inter Tight 700, fluid clamp, navy-900), optional subhead, hairline divider, then children with `gap-7` between blocks. Used by all 5 step pages.

2. `QuoteStepNav.tsx` — Bottom nav. Props: `onBack`, `onContinue`, `backLabel`, `continueLabel`, `continueDisabled?`, `rightSlot?` (for the optional total readout on Options). Desktop: inline row, secondary left / primary right. Mobile: full-width sticky-bottom with hairline border-top, primary on top, secondary below.

3. `QuoteRadioTile.tsx` — Single tile (radio or checkbox visual). Props: `selected`, `onClick`, `icon?`, `label`, `description?`, `priceTag?`, `multi?` (controls aria semantics only). Hairline border, p `18px 22px`, radius 8, white→cream hover, selected = 2px navy-900 border + mercury-red dot top-right. Used on Options (replaces local `OptionCard`) and Purchase Path tiles.

4. `QuoteFormField.tsx` — Label + control wrapper. Props: `label`, `required?`, `helper?`, `error?`, `htmlFor`, `children`. Renders the spec'd label (Inter 600, 12px, uppercase, 0.14em, navy-900/70%), gold asterisk when required, helper / error text below. Used on Boat Info inputs in Pass 2.

5. `QuoteInput.tsx`, `QuoteSelect.tsx`, `QuoteTextarea.tsx` — Thin restyles wrapping the existing `<Input>`, Radix `<Select>`, `<Textarea>` with the spec'd visual layer (white bg, hairline border, 4px radius, 14×16 padding, 15px Inter, gold focus ring, mercury-red error border). They forward all props and `ref`s; no behavior changes. Used by Boat Info and Promo in Pass 2 and Summary in Pass 3.

6. `QuoteCheckbox.tsx` — 18×18 hairline-border box, navy-900 fill on check, cream check icon, gold focus ring. Wraps the existing Radix checkbox.

These are all presentational. They contain no state, no validation, no submit logic.

---

### File plan (what changes where)

**Restyled in place**
- `QuoteLayout.tsx` — swap background to `bg-repower-paper`, drop the gradient orbs, keep `LuxuryHeader` (already navy-900 solid in non-hero pages — verify; if not, switch to the established solid header variant). Continue rendering `QuoteProgressStepper`. No prop or behavior change.
- `QuoteProgressStepper.tsx` — full visual rewrite to spec (active = filled navy-900 + cream number; completed = gold-outlined circle + gold check; upcoming = hairline circle + 30% navy; connectors hairline → gold when both adjacent are completed; mobile collapses to "Step X of N · Label" + thin progress bar, hides dots). State machine, conditional-step filtering, click-to-navigate, and `isStepAccessible` logic untouched.
- `OptionsPage.tsx` — replace the outer container + header block with `<QuotePageShell eyebrow="STEP 2 · OPTIONS" title="…existing heading string…" subhead="…existing subhead if present…">`. Replace local `OptionCard` JSX with `<QuoteRadioTile>` (same props/handlers — `isSelected`, `onToggle`, `disabled`, details button). Replace section headers with a small uppercase navy-900/70% label + hairline. Replace the sticky desktop footer with `<QuoteStepNav>` (and surface the existing options-total readout via `rightSlot`). Mobile gets the new sticky nav for free. All copy strings, handlers, `dispatch` calls, localStorage save, and `navigate()` calls preserved verbatim.
- `VisualOptionCard.tsx` — minor border/hover tweak so it shares the radio-tile selected visual (2px navy border, mercury-red dot). Image, layout, copy, click handler unchanged.
- `BatteryOptionPrompt.tsx` — restyle the two choice tiles to match `QuoteRadioTile` aesthetic (or render through it). Copy and `onSelect` payload untouched.

**Untouched in Pass 1**
- `PurchasePath.tsx`, `PurchasePathPage.tsx`, `BoatInformation.tsx`, `BoatInfoPage.tsx`, `PromoSelectionPage.tsx`, `QuoteSummaryPage.tsx`, all summary subcomponents — Pass 2 and Pass 3.
- All hooks, contexts, pricing, `QuoteContext`, `useMotorOptions`, deposit/Stripe/PDF logic — never touched in any pass.

---

### Pass 1 deliverable (what I'll build when you approve)

1. Create the 6 shared primitives under `src/components/quote-builder/redesign/`.
2. Rewrite `QuoteProgressStepper.tsx` visuals to spec (logic intact).
3. Reskin `QuoteLayout.tsx` background.
4. Reskin `OptionsPage.tsx` to use `QuotePageShell`, `QuoteRadioTile`, `QuoteStepNav`. Reskin `VisualOptionCard` and `BatteryOptionPrompt` selected/hover states.
5. No copy edits anywhere. No em dashes introduced. Palette locked to repower tokens.

Then I stop and you review step 2 in the preview before I start Pass 2.

---

### Open question

The brief references a "SolidHeaderLayout already established for non-hero pages." The current `QuoteLayout` uses `LuxuryHeader`. I'll inspect `LuxuryHeader` to confirm whether it already renders the solid navy-900 variant on internal pages, or whether I should switch to the repower header used on `/repower` and the new motor selection page. If unclear, I'll match whatever the post-redesign motor selection page renders so step 2 is visually continuous with step 1. No new header component will be invented.
