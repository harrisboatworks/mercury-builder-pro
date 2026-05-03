# Subhead Token — Navy-900 @ 65%

Use this token for supporting subhead / body-lead text that sits beneath an H1 on a cream (`#FAF8F4`) page background.

## Token

| Property        | Value                                |
| --------------- | ------------------------------------ |
| Base color      | `#050E1C` (navy-900)                 |
| Opacity         | `0.65`                               |
| Effective RGB   | `rgb(91, 96, 104)` over `#FAF8F4`    |
| Tailwind usage  | `text-[#050E1C]/65`                  |
| Typography      | Inter 400, 18px desktop (15-16px on small mobile if single-line is required) |

## Background pairing

Designed against the cream paper background `#FAF8F4`. Do not reuse this token on white (`#FFFFFF`) or dark surfaces without re-checking contrast.

## WCAG Contrast (verified 2026-05-03)

- Effective foreground vs `#FAF8F4`: **5.97 : 1**
- ✅ WCAG 2.1 AA — normal text (≥ 4.5:1)
- ✅ WCAG 2.1 AA Large (≥ 3:1)
- ❌ WCAG 2.1 AAA normal (7:1) — acceptable for non-essential supporting text

If a stricter AAA pass is required, drop opacity to ~50% (darker effective color) or use full `#050E1C` at 80% (≈ 7.2:1).

## Reference implementation

- `src/pages/quote/MotorSelectionPage.tsx` — "Live pricing. Real quotes. Three minutes." subhead under the "Choose your power." H1.

## Semantics

Subhead must be a sibling `<p>` of the `<h1>`, never nested inside the heading element. Decorative eyebrow labels stay as `<span>` so the heading hierarchy is unambiguous to screen readers.
