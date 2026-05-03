## Fix Trust Strip Label Truncation on Mobile

The 5 trust badges sit in a 2-col mobile grid with uppercase + heavy letter-spacing (`tracking-[0.18em]`), so labels like "Family-Owned Since 1947" and "7-Year Warranty Available" get clipped/squished.

### Fix in `src/components/repower/TrustStrip.tsx`

- Tighter mobile letter-spacing (`tracking-[0.12em]`), back to `0.18em` at `md:`.
- Slightly smaller mobile font (`text-[10px]`) → `text-[11px]` at `md:`.
- Less horizontal padding inside cells on mobile (`px-2` vs `px-4`).
- Tighter gutter (`gap-x-3`) and remove `divide-x` on mobile (it eats horizontal room and looks messy with wrapping); keep dividers from `md:` up.
- `leading-snug` + `break-words hyphens-auto` so two-line labels read cleanly.
- Trim section padding a hair on mobile (`py-8`).

Result: every label has room to render fully on a 375–390px screen without truncation.
