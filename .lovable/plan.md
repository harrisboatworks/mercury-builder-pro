## Goal

Remove the now-redundant **Engine Type** dropdown from the trade-in form. The Vercel HBW API auto-decodes stroke from the model code, and the small preview chip already shows the detected stroke — so the dropdown adds friction without value.

## Changes

### `src/components/quote-builder/TradeInValuation.tsx`

1. **Remove the Engine Type `<div>` block** (lines ~490–507) — the entire `<Select>` for `tradeInInfo.engineType`.

2. **Stop forwarding `engineType` to the API** so the decoder always wins:
   - Line ~111–116: drop the `explicitStroke` ternary; pass `stroke: undefined` (or just omit) in the `fetchHBWValuation` call at line 125.
   - Line ~169 / ~176: same — remove the `engineType`-based stroke calc in the local fallback path; default to `'4-stroke'` (the proxy/API will decode the real value from the model anyway).
   - Line ~702 (the "View full report" `buildHBWReportUrl` call): remove the `stroke` argument so the report URL relies on model decoding.

3. **No layout change needed** — the grid is `md:grid-cols-2` (Year + Model or HP), so removing the third cell leaves a clean two-column layout.

### Out of scope
- `TradeInInfo.engineType` type stays (still used elsewhere in the codebase / saved quotes); we just stop collecting it on this form.
- Proxy and API contracts unchanged — they already treat `stroke` as optional.
- Quote-builder `/quote/trade-in` step inherits the same component automatically.
