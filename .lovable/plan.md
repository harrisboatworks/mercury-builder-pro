# /quote/summary visual redesign plan

## Scope guarantee
Visual layer only. I will NOT touch:
- `src/lib/react-pdf-generator.tsx`, `pdf-executive.ts`, `pdf-helpers.ts`, `professional-quote-pdf.tsx`, vite config, shims, or anything in the PDF pipeline.
- `handleDownloadPDF`, `handleReserveDeposit`, `handleApplyForFinancing`, `handleStepComplete`, `handleDepositSubmit`, soft-lead save, Supabase calls, edge-function invokes.
- `useQuoteRunningTotal`, `finance.ts`, `quote-utils.ts`, `build-accessory-breakdown.ts`, the line items array, taxes, financing math.
- Any user-facing copy, labels, button text, helper text, error toasts, terms.
- Field set, action set, or behavior. Same things, restyled.

## Files I plan to touch

1. `src/pages/quote/QuoteSummaryPage.tsx` — replace ONLY the JSX layout shell inside the existing `return (...)` (the part starting at the `<div className="max-w-7xl ...">` wrapper, lines ~1024-1194). All hooks, handlers, state, effects, data computations stay byte-identical. I'll wrap the page in `QuotePageShell` (eyebrow / H1 / subhead / hairline) and the existing two-column grid becomes the prescribed 60/40 layout with cream sticky card on the right.

2. `src/components/quote-builder/PricingTable.tsx` — visual restyle only of row markup (typography, spacing, hairline dividers, gold edit links). Props, data, conditional logic, totals, line item ordering, copy stay identical. No prop changes.

3. `src/components/quote-builder/StickySummary.tsx` — visual restyle of the desktop sticky card (cream `#F5F1EA`, hairline border, 12px radius, 32px padding, eyebrow TOTAL, big total in Inter Tight, mini-line items, mercury-red primary CTA, ghost secondary). All props, handlers, animations, AnimatePresence blocks, confetti, sound, conditional rendering preserved. Mobile aside currently doesn't exist here; mobile CTA section in the page file gets the same restyle.

4. `src/components/quote-builder/QuoteProgressStepper.tsx` — verify it can render "step 6 of 6 active, all others complete"; if it already does (it's used elsewhere), I'll re-enable it on this page (currently `showProgress={false}` in `QuoteLayout`). If its visual treatment doesn't match the design system, I'll restyle visually only.

No new files needed; I'll reuse `QuotePageShell`, `QuoteFormField`, `QuoteInput` already locked in for other steps.

## Layout result

```text
+------------------------------------------------------------+
| RepowerHeader (solid)                                      |
| QuoteProgressStepper (step 6 active)                       |
+------------------------------------------------------------+
|  max-w-1100 py-12 px-6                                     |
|                                                            |
|  STEP 6 . YOUR QUOTE   (eyebrow, mercury-red)              |
|  H1 (existing heading copy, untouched)                     |
|  Subhead (existing copy, untouched)                        |
|  ----------------------------- hairline                    |
|                                                            |
|  +-------------------+  +---------------------------+      |
|  |  60%              |  | 40% sticky cream card      |     |
|  |  Line items       |  | TOTAL eyebrow              |     |
|  |  (PricingTable    |  | $XX,XXX (48px Inter Tight) |     |
|  |   restyled rows)  |  | tax line                   |     |
|  |                   |  | --------- hairline         |     |
|  |  BonusOffers      |  | mini line items            |     |
|  |  AdminControls    |  | --------- hairline         |     |
|  |                   |  | financing snippet          |     |
|  |  Back ghost btn   |  | --------- hairline         |     |
|  |                   |  | Primary CTA (mercury-red)  |     |
|  |                   |  | Secondary ghost btns       |     |
|  |                   |  | trust line                 |     |
|  +-------------------+  +---------------------------+      |
|                                                            |
|  Mobile: stack, sticky CTA bar at viewport bottom          |
+------------------------------------------------------------+
```

## What stays exactly as-is
- All data passed into `<PricingTable>` and `<StickySummary>`.
- The `noMotorSelected` gating, `disabled` states, tooltips/titles.
- `QuoteRevealCinematic`, `StaleQuoteAlert`, `DepositInfoDialog`, `SaveQuoteDialog`, `SaveQuoteWithAuth`, `PhoneCapture` rendering.
- All `framer-motion` variants, delays, and the iOS opacity guards already in place.
- The existing `quoteValidUntil` computation and prop flow.
- Every button's `onClick` wiring, every label string.

## Token reference (from locked design system)
- bg paper `#FAF8F4`, cream card `#F5F1EA`, navy-900, mercury-red, gold accent
- Inter Tight 700 for H1 and big total; Inter for body; uppercase tracked eyebrows
- Hairline = `1px solid rgba(10,22,40,0.10)`
- Field styling already in `QuoteInput` / `QuoteFormField` (will not be needed unless this page has a customer info form — current code shows it does NOT; customer info is collected via `DepositInfoDialog`/`SaveQuoteDialog` modals, so no inline form fields to restyle on this page).

## Verification I'll do after implementing
- Read the rendered file end-to-end to confirm no handler signature changed.
- Confirm `handleDownloadPDF`, `handleReserveDeposit`, `handleApplyForFinancing` are referenced from JSX exactly as before.
- Confirm no edits leaked into PDF/finance/quote-utils files.

Awaiting your OK before I make any changes.