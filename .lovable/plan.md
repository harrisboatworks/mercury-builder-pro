## Goal

Improve the trade-in "Model or HP" preview chips so they don't just confidently announce a decode — they also surface when input is **ambiguous or low-confidence**, and offer **closest-match suggestions** the user can click to accept.

## Current behavior (lines 439–474 of `src/components/quote-builder/TradeInValuation.tsx`)

A small inline IIFE under the input shows two chips: detected HP and detected stroke. It always asserts a result (e.g. bare `15` is silently labeled "4-Stroke") and shows nothing when nothing matches — leaving the user with no guidance for typos or odd codes.

## Approach

Replace the IIFE with a small `decodeTradeInModel(raw)` helper colocated above the component, then render a richer preview block.

### 1. New helper: `decodeTradeInModel`

Returns `{ hp, stroke, hpConfidence, strokeConfidence, suggestions, warnings }`.

- **HP extraction**: prefer 2–3 digit HP near the start (e.g. `F115`, `150 ELPT`); ignore years like `1995`. Confidence:
  - `high` — clear pattern (Mercury bare number, `F\d+`, `DF\d+`, `BF\d+`, `DT\d+`).
  - `medium` — number embedded with extra alphanumerics.
  - `low` — number found but conflicts with multiple candidates, or HP outside plausible range (2–450).
- **Stroke detection**: keep current regex set, plus:
  - Mercury 2-stroke legacy markers (e.g. `XR`, `Pro XS` carb era — keep narrow), `EFI` alone → unknown.
  - Plain bare number → `unknown` (NOT `4-Stroke`) with confidence `low` and a hint that "modern Mercury since ~2007 is 4-stroke; older may be 2-stroke."
- **Warnings** (array of short strings):
  - "Year not entered — can't infer stroke from era" (when stroke is unknown and year is missing).
  - "HP `{n}` outside typical 2–450 range" when implausible.
  - "Couldn't recognize this code — try `F115`, `150 ELPT`, or just the HP."
- **Suggestions** (max 3): when input is partially recognized, propose normalized forms:
  - Bare number `N` → `["F{N}" (Yamaha 4-stroke), "{N} ELPT" (Mercury), "DF{N}" (Suzuki)]` filtered by what the typed brand suggests if `tradeInInfo.brand` is set.
  - Typo of a known prefix (e.g. `F-115`, `f 115`) → `F115`.
  - Each suggestion clickable; click sets `tradeInInfo.model` to that string and clears `estimate`.

### 2. UI changes (replace the chip block)

```text
[150 HP ✓ high]  [4-Stroke ~ medium]   (auto-detected)
⚠ Year not entered — can't infer stroke from era
Did you mean:  [F150]  [150 ELPT]  [DF150]
```

- HP/stroke chips get a subtle confidence affordance:
  - high → existing solid styles
  - medium → outline variant + `~` prefix
  - low/unknown → muted + `?` prefix
- Warnings rendered as `text-xs text-amber-700` lines with an `AlertTriangle` icon (lucide).
- Suggestion chips rendered as small `<button type="button">` elements styled like outline pills; clicking calls the same `onChange` path the input uses (mirror numeric → `horsepower`, otherwise leave `horsepower: 0` and let API decoder run).

### 3. No backend / API changes

All logic is client-side display polish. Existing API decoder still runs on submit; this just helps the user enter a code the decoder will recognize.

### 4. Files

- `src/components/quote-builder/TradeInValuation.tsx` — add `decodeTradeInModel` helper near the top (before the component) and replace the inline chip IIFE (lines 439–474) with the richer preview block. Also factor a tiny `applyModelText(text: string)` closure to share the input + suggestion-click code paths.

### Out of scope

- Fuzzy matching against the live motors DB (would require a query). Suggestions are pattern-based heuristics only.
- Brand-aware overrides beyond filtering the bare-number suggestion list.
