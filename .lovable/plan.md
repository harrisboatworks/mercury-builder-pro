# Trade-In Decoder: Unit Tests + Clickable Override Chips

## Goal

1. Lock down `decodeTradeInModel` behavior with a vitest suite covering model tokens, year edge cases, and multi-number strings, so future regex tweaks can't silently regress it.
2. Make the decoded HP and Stroke preview chips **interactive** — click a chip to manually override what the parser inferred, and the warnings/suggestions/badges immediately reflect the override.

## Part 1 — Export & test the decoder

### 1a. Make the decoder importable from a stable path

`decodeTradeInModel` is already `export`ed from `src/components/quote-builder/TradeInValuation.tsx`. To keep the test file lean (no React imports pulled in), extract the pure function into a new module:

- **New file**: `src/components/quote-builder/tradeInModelDecoder.ts`
  - Move `Confidence`, `DecodeResult`, `DecodeContext`, `BRAND_FROM_PREFIX`, and `decodeTradeInModel` here verbatim.
- **Update** `TradeInValuation.tsx` to re-export and use it:
  ```ts
  export { decodeTradeInModel, type DecodeResult, type Confidence } from './tradeInModelDecoder';
  ```
  All in-file references stay the same.

### 1b. Add the test suite

- **New file**: `src/components/quote-builder/tradeInModelDecoder.test.ts`

Coverage groups (each is a `describe` block):

**Model tokens**
- `F115` → hp 115, stroke 4-Stroke, both `high`, reason mentions Yamaha.
- `DF90` → hp 90, 4-Stroke high, reason mentions Suzuki.
- `BF50` → hp 50, 4-Stroke high, reason mentions Honda.
- `DT40` → hp 40, 2-Stroke high.
- `150 ELPT` → hp 150 high (leading number), stroke null until year provided.
- `OptiMax 200` → hp 200, stroke OptiMax high.
- `FOURSTROKE 90` and `Four-Stroke 90` → 4-Stroke high.
- `2S 60` → 2-Stroke high.
- Empty / whitespace string → all nulls, `unknown` confidences, no warnings.
- Garbage like `"abc"` → null hp, warning about unrecognized code.

**Year edge cases (bare HP)**
- `"90"` + year 2015 → 4-Stroke `medium`, reason mentions ≥2007.
- `"90"` + year 2007 (boundary) → 4-Stroke `medium`.
- `"90"` + year 1995 → 2-Stroke `medium`, reason mentions <2000.
- `"90"` + year 2003 (gap zone, no marker) → stroke null, `low`, warning about ambiguity.
- `"90"` no year → stroke null, `low`, warning to enter year.
- Marker beats year: `F90` + year 1995 → still 4-Stroke `high` (marker wins).

**Multi-number strings**
- `"2008 90 ELPT"` (year embedded in text but year-range filter excludes it) → hp 90, year filtered out of `embedded`.
- `"90 25"` (two HPs, no markers) → hp 90, confidence `low`, warning "Multiple numbers found".
- `"F115 25"` (marker + extra number) → hp 115 from prefix `high`, ignores 25.
- `"1999"` alone → no HP (filtered by year exclusion), warning unrecognized.
- `"9.9"` → hp 9.9 high (decimal handling).
- `"500"` → hp captured at `low` with out-of-range warning.

**Suggestions**
- Numeric `"115"` + brand `Mercury` → suggestions = `["115 ELPT"]`.
- Numeric `"115"` + brand `Yamaha` → `["F115"]`.
- Numeric `"115"` + no brand → first 3 generic suggestions.
- `"F 115"` (spaced prefix) → suggestion `["F115"]`.

## Part 2 — Clickable HP / Stroke override chips

### 2a. State

Add an override state in `TradeInValuation` next to `estimate`:
```ts
const [decodeOverride, setDecodeOverride] = useState<{
  hp?: number | null;
  stroke?: '4-Stroke' | '2-Stroke' | 'OptiMax' | null;
}>({});
```

Reset `decodeOverride` to `{}` whenever `applyModelText` runs (typing or suggestion click) so a fresh model text starts clean.

### 2b. Apply overrides to the decode result

Inside the IIFE that renders the preview, after computing `decoded`, derive a final view model:

```ts
const finalHp = decodeOverride.hp !== undefined ? decodeOverride.hp : decoded.hp;
const finalStroke = decodeOverride.stroke !== undefined ? decodeOverride.stroke : decoded.stroke;
const hpConfidence = decodeOverride.hp !== undefined ? 'high' : decoded.hpConfidence;
const strokeConfidence = decodeOverride.stroke !== undefined ? 'high' : decoded.strokeConfidence;
```

Recompute warnings/suggestions to drop the entries the user has resolved:
- If `decodeOverride.hp !== undefined`: filter out warnings matching `/HP|Multiple numbers|outside typical/i`.
- If `decodeOverride.stroke !== undefined`: filter out warnings matching `/Stroke|stroke/`.
- If user overrode HP, hide numeric HP suggestions.

Add a reason line when overridden, e.g. `"Manually set by you (click chip again to clear)"` appended to `hpReasons` / `strokeReasons`.

### 2c. Interaction model

Each chip becomes a `<button type="button">` with three behaviors:

- **HP chip click**: open a tiny popover (use existing `Popover` from `@/components/ui/popover`) with:
  - Number input (default = current `finalHp`), Enter or Apply commits.
  - Quick pick row of common HPs near the parsed value: `[parsed-25, parsed-10, parsed, parsed+10, parsed+25]` clamped to 2–450.
  - "Clear override" link, visible only when an override is active.
- **Stroke chip click**: popover with three buttons: `4-Stroke`, `2-Stroke`, `OptiMax`, plus "Clear override" when active.

When the user commits an override:
1. Update `decodeOverride`.
2. Sync canonical fields on `tradeInInfo` so the rest of the form (and the valuation API) sees it:
   - HP override → `onTradeInChange({ ...tradeInInfo, horsepower: newHp })`.
   - Stroke override → `onTradeInChange({ ...tradeInInfo, engineType: '4-stroke'|'2-stroke'|'optimax' })` (mapping to the existing lowercase values used by `estimateTradeValue`).
3. Reset `estimate` and `autoEstimateTriggered.current = false` so the next valuation uses the override.

### 2d. Visual cues

- When a chip is overridden, swap the confidence badge label to `Manual` with a neutral slate style: `bg-slate-100 text-slate-700 border-slate-200`.
- Add a subtle `Pencil` icon (lucide) inside the chip to signal it's editable. Tooltip / `aria-label`: "Click to override".
- Keep the existing prefix (`~`, `?`) only when not overridden.

### 2e. Accessibility

- Buttons get `aria-label="Override detected HP"` / `"Override detected stroke type"`.
- Popover content gets focus on open and supports Escape to close (Radix default).

## Files touched

- **New** `src/components/quote-builder/tradeInModelDecoder.ts` — extracted pure decoder.
- **New** `src/components/quote-builder/tradeInModelDecoder.test.ts` — vitest suite.
- **Edit** `src/components/quote-builder/TradeInValuation.tsx` — re-export from new module, add override state, replace the chip JSX with clickable popover-driven buttons, recompute warnings/suggestions, sync overrides into `tradeInInfo`.

## Out of scope

- Persisting overrides on the saved quote payload beyond the existing `horsepower` / `engineType` fields (those already round-trip).
- Server-side decoding changes — overrides only affect the client preview + form state passed to the existing valuation API.
- Brand override on the chip (brand already has its own Select).
