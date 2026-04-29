## Goal

Make the trade-in model preview **explainable**: show a colored confidence badge next to each decoded HP/stroke value, and list the input parts (model text tokens, year, brand) that drove the decision.

## Current state (`src/components/quote-builder/TradeInValuation.tsx`)

- `decodeTradeInModel(raw, brand?)` already returns `{ hp, stroke, hpConfidence, strokeConfidence, warnings, suggestions }`.
- Preview chips show HP / stroke with subtle styling tweaks per confidence (`~` / `?` prefix), but no explicit badge label and no "why".
- Year and brand from `tradeInInfo` are not yet passed into the decoder.

## Changes

### 1. Decoder API — add reasons + accept context (`src/components/quote-builder/TradeInValuation.tsx`, helper above the component)

- Change signature: `decodeTradeInModel(raw: string, ctx: { brand?: string; year?: number } = {})`.
- Add to `DecodeResult`:
  - `hpReasons: string[]` — short strings like `"F115" prefix is a standard Yamaha HP code` or `Single number "150" embedded in model text`.
  - `strokeReasons: string[]` — e.g. `Matched "4S" → 4-Stroke marker`, `Bare HP + year 2014 (≥2007) → likely 4-Stroke (modern Mercury)`.
- Use `year` as a tiebreaker for bare-number stroke detection:
  - `year >= 2007` → `4-Stroke` at `medium` confidence (modern Mercury era).
  - `year < 2000` → `2-Stroke` at `medium` confidence.
  - No year → keep `low` and surface a warning to enter year.
- Keep all existing warnings/suggestions behavior.

### 2. Update the call site

The IIFE currently calls `decodeTradeInModel(raw, tradeInInfo.brand)`. Update to:
```ts
decodeTradeInModel(raw, { brand: tradeInInfo.brand, year: tradeInInfo.year })
```

### 3. Confidence badge UI

Next to each chip (HP and stroke), render a small inline badge:

| Confidence | Label | Style |
|---|---|---|
| high | `High` | green: `bg-emerald-100 text-emerald-700 border-emerald-200` |
| medium | `Medium` | amber: `bg-amber-100 text-amber-700 border-amber-200` |
| low | `Low` | red-ish: `bg-rose-100 text-rose-700 border-rose-200` |
| unknown | (hide) | — |

Badge is a tiny rounded pill rendered immediately after each chip:
```tsx
<span className="inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ...">
  {label}
</span>
```

### 4. "Why" reasons display

Below the chip row, render a small explainer block when `hpReasons.length || strokeReasons.length`:

```text
Based on:
• HP: "F115" prefix is a standard Yamaha HP code
• Stroke: Matched "F1" → 4-Stroke marker
```

- Use `text-xs text-muted-foreground font-light` with a leading `Info` icon (lucide).
- One bulleted line per reason. Hide the block entirely if both arrays are empty.

### 5. Files touched

- `src/components/quote-builder/TradeInValuation.tsx` — only file (helper + preview block + call site).
- Add `Info` to the existing lucide import line if not already present.

### Out of scope

- Persisting confidence/reasons on the quote. This is purely a transparency UX layer; the API decoder still owns the authoritative decode at submit time.
- Brand-aware stroke disambiguation beyond what year already provides.
