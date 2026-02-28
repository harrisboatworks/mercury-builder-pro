

## Contrast Audit: Dark-Background Pages in Quote Flow

**Pages with dark backgrounds:**
1. `PackageSelectionPage.tsx` — Already fixed (stone-950 background, stone-200 text)
2. `PromoSelectionPage.tsx` — **Has issues** (stone-900/800 background, multiple low-contrast elements)

No other quote flow pages use dark backgrounds. The `PromoSelectionBadge.tsx` has a small `bg-stone-900` header bar but lives inside light pages — acceptable.

---

## Issues in PromoSelectionPage.tsx

Per the established standard (`stone-950` background, `text-stone-200` minimum for body text, `text-white` for interactive elements), the following violations exist:

| Line | Current | Fix |
|------|---------|-----|
| 228 | `from-stone-900 via-stone-800 to-stone-900` | `from-stone-950 via-stone-900 to-stone-950` |
| 234 | `text-white/70` (Back button) | `text-white` |
| 283 | `text-stone-400` (subtitle) | `text-stone-200` |
| 294 | `bg-white/10 border-white/20` (warranty badge) | `bg-white/15 border-white/30` |
| 315 | `text-stone-400` (warranty sub-text) | `text-stone-200` |
| 335 | `text-white/60` (divider text) | `text-white/80` |
| 437 | `text-white/70` (rate months) | `text-white/90` |
| 438 | `text-white/50` (estimated payment) | `text-white/70` |
| 454 | `text-white/50` (tip text) | `text-white/70` |
| 470 | `text-stone-500` (offer ends text) | `text-stone-300` |
| 491 | `text-white/50` (hint text) | `text-white/70` |

## Implementation

Single file edit: `src/pages/quote/PromoSelectionPage.tsx` — apply all 11 contrast fixes listed above to match the established standard from `PackageSelectionPage.tsx`.

