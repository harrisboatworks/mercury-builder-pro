## Goal

On `/agents`, the financing rates copy should always state the standard tiered rates AND, when a manufacturer promo (currently TD 5.48%) is active, append the current promo. When no promo is active, append a short pointer that promotional rates run periodically. This applies to both the visible bullet and the FAQPage JSON-LD answer so AI agents reading the page see the same wording.

## Changes (single file: `src/pages/AgentsHub.tsx`)

Replace the two top-of-file constants (lines 9–15) so they always lead with the standard tiered rates, then append a promo line driven by `isTDAlwaysOnActive()` / `getMercuryFinancingFaqAnswer()`.

New wording:

- `FINANCING_RATES_BULLET` (always):
  - Base: `"Standard tiered rates: 8.99% APR under $10,000, 7.99% APR $10,000 and up (OAC). Terms up to 144 months via LightStream / Financeit."`
  - If TD promo active, append: `" Current promo: 5.48% APR through Dec 31, 2026 via the Mercury TD 'Always On' program (OAC)."`
  - If not active, append: `" Promotional manufacturer rates run periodically, see /promotions for the current offer."`

- `FINANCING_RATES_FAQ_TEXT` (always):
  - Base: `"Financing minimum is $5,000 CAD. Standard tiered rates: 8.99% APR under $10,000, 7.99% APR $10,000 and up (OAC). Terms up to 144 months via LightStream / Financeit. A $349 DealerPlan fee is added post-tax for financed purchases. Do not show monthly payment estimates below $5,000."`
  - If TD promo active, append: `" Current promo: through December 31, 2026, Mercury Marine Canada's TD 'Always On' program offers 5.48% APR (OAC) on new eligible Mercury outboards; standard tiered rates resume after the program ends."`
  - If not active, append: `" Promotional manufacturer rates (e.g. TD subvention programs) run periodically, see /promotions for the current offer."`

Both branches keep the existing constraints: no em-dashes, no quoted attributions, CAD only, $5,000 financing minimum, $349 DealerPlan fee mention preserved.

## Out of scope

- No changes to `TDAlwaysOnOffer.tsx` helpers, the `/promotions` page, the financing constants used elsewhere, or any other page copy.
- No changes to the article files or markdown twins.
- No FAQ schema reshuffling beyond the single answer text already wired to `FINANCING_RATES_FAQ_TEXT`.

## Validation

- `npx tsc -p tsconfig.app.json --noEmit`
- Visual check of the "Operating constraints" bullet on `/agents`
- Grep the prerendered `/agents` HTML to confirm both the standard tiered rate string and the "Current promo: 5.48% APR" string appear in the FAQPage JSON-LD.
