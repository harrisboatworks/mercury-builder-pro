## Goal

On the `/trade-in-value` page (and shared TradeInValuation component), let customers type a model code like `150 ELPT`, `F115LB`, `DF140ATL`, or just `150`. The Vercel HBW API decodes HP and stroke automatically — no client-side parsing.

## Changes

### 1. `src/components/quote-builder/TradeInValuation.tsx`
- Replace the **Horsepower** number `<Input>` (lines ~409–435) with a single text input:
  - Label: **"Model or HP *"**
  - Placeholder: `e.g. 150 ELPT, F115LB, or just 150`
  - Bound to `tradeInInfo.model` (instead of `horsepower`).
  - When the user types a plain number, also mirror it into `tradeInInfo.horsepower` so existing local-fallback math and validation still work; otherwise leave `horsepower` at 0 and rely on the API decode.
- Remove the duplicate **Model** field inside the "Add more details" collapsible (lines ~518–529) — it's now the primary field.
- Update validation (`missingFields`, lines ~76, ~98) so the required check passes when **either** `tradeInInfo.model` is non-empty **or** `tradeInInfo.horsepower > 0`.
- Relabel the **Engine Type** dropdown to **"Engine Type (optional)"** with placeholder "Auto-detect from model" — keep the existing options (4-Stroke, 2-Stroke, OptiMax). It becomes an override, not required.
- Trigger the auto-estimate effect on changes to `tradeInInfo.model` in addition to `horsepower`.
- In the `fetchHBWValuation` call (lines ~111–119), always pass `model: tradeInInfo.model` and only pass `stroke` when the user explicitly picked one (omit it otherwise so the API can infer).
- Same change for the "View full report" `buildHBWReportUrl` call (lines ~660–664): pass `model` and only pass `stroke` if user-selected.

### 2. `src/lib/trade-valuation.ts` — `fetchHBWValuation` (lines ~683–738)
- Make `horsepower` optional in the params type.
- Send `hp` only when it's > 0; otherwise omit it. Always send `model` when provided.
- Make `stroke` optional in what we forward (don't default to `'4-stroke'` here — let the API decide).

### 3. `supabase/functions/hbw-valuation-proxy/index.ts`
- Make `hp` and `stroke` optional in the proxy's validation:
  - Require **either** a non-empty `model` **or** a valid `hp` (1–1000). Return 400 only if both are missing.
  - If `stroke` is provided, still validate against `ALLOWED_STROKES`; if absent, omit it from the upstream payload (Vercel API will infer).
- Forward `{ brand, year, condition, model?, hp?, stroke?, hours? }` to Vercel — drop fields that are `undefined` instead of sending nulls.
- Redeploy `hbw-valuation-proxy`.

### 4. Verification
- `curl` the proxy with `{ brand: "Mercury", year: 2016, model: "150 ELPT", condition: "good", hours: 400 }` (no `hp`, no `stroke`) and confirm a sane valuation comes back.
- `curl` again with `{ brand: "Mercury", year: 2022, model: "90", condition: "good" }` (plain number) — should match the 2022 90hp result.
- Open `/trade-in-value`, type `F115LB` for a 2018 Yamaha Good condition, confirm valuation renders.

## Out of Scope
- `public-quote-api`'s `estimate_trade_in` action stays as-is (already supports `model` passthrough per previous turn).
- Quote-builder `/quote/trade-in` step inherits the same component and benefits automatically; no extra page changes.
- No client-side decoder logic — Vercel API owns parsing.
