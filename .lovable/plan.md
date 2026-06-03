## Goal
Reconcile motor prices in `src/data/blogArticles.ts` to the canonical pricing source (`public/pricing-reference.md`, regenerated 2026-06-03), with focus on (a) embedded FAQ / structured-data fields tied to last turn's edits, (b) the two named posts, and (c) any other post quoting specific SKU MSRP/dealer prices. Range-based "all-in installed" estimates that are still inside ±10% of plausible build-ups will be left alone (flagged in report only).

## Canonical anchors (CAD, from /pricing-reference.md)
- 2.5MH FourStroke: $1,298 (MSRP $1,385)
- 9.9MH FourStroke: $2,999 (MSRP $3,860)
- 9.9 EFI EH/ELH: $3,299 / $3,399
- 60 ELPT FourStroke: $12,040 (MSRP $13,415)
- 75 ELPT FourStroke: $14,476 (MSRP $16,125)
- 90 ELPT FourStroke: $14,960 (MSRP $16,665)
- 115 ELPT FourStroke: $17,083 (MSRP $19,030)
- 115 ELPT Pro XS: $17,490 (MSRP $19,485)
- 150 L FourStroke: $22,242 (MSRP $24,780)
- 150 ELPT Pro XS: $24,349 (MSRP $27,125)
- 175 / 200 / 250 Pro XS: $27,891–$34,029 dealer

## Pass 1 — Verify last turn's FAQ/structured-data
For the four posts edited last turn (`ontario-mercury-outboard-price-guide`, `outboard-trade-in-value-ontario-hbw`, `mercury-outboard-monthly-payment-ontario-2026`, `mercury-115-vs-150-hp-honest-ontario-dealer-guide-2026`), read each `faqs:` array and any inline JSON-LD / structured-data blocks. Where the FAQ answer cites a dollar figure for a SKU also referenced in body content (e.g., 150 Pro XS dealer price, monthly payment, 90/115 ELPT MSRP), confirm the FAQ string carries the same updated number; rewrite to match if drifted.

## Pass 2 — Targeted reconciliation of the two named posts

### `mercury-pricing-promotions-2026` (line 10021)
- "Current 2026 MSRP Ranges" table is stale and lists Verado (violates the "Verado not actively promoted" core memory). Replace with a canonical-aligned table (FourStroke + Pro XS only):

  | Motor Category | MSRP Range (CAD) |
  |---|---|
  | 2.5–20 HP portable / tiller | $1,385–$6,085 |
  | 25–60 HP FourStroke | $5,860–$14,545 |
  | 75–115 HP FourStroke | $16,125–$19,930 |
  | 115 HP Pro XS | $19,485–$20,385 |
  | 150 HP FourStroke / Pro XS | $24,780–$27,265 |
  | 175–250 HP FourStroke / Pro XS | $30,685–$41,740 |
  | 300 HP FourStroke | $40,575–$42,935 |

  Note Verado as special-order via phone/email only (no price). 
- Update `::cost-stack` ranges so they no longer claim "60 to 115 mid-range main: $11,500 – $17,800" — canonical 60–115 dealer is $12,040–$17,892. Bump to "$12,000 – $18,000". Update "FourStroke 9.9 (kicker)" to "$2,999 – $5,200" (canonical 9.9MH–9.9EXLHPT ProKicker). V6 150–250 stack item updated to "$22,000 – $37,500" (canonical 150L FS to 250XL FS dealer).
- Bump `dateModified` to `2026-06-03`. Update the inline `*Last reviewed:* 2026-05-07` to `2026-06-03`.

### `cheapest-mercury-outboard-canada-2026` (line 13671)
- `::cost-stack` "Motor (the big number) $12,000 – $35,000 CAD" — replace with "$1,298 – $38,539" so the floor reflects the 2.5MH and the ceiling reflects the 300XL DTS (matches the post's premise about the cheapest Mercury). Other rigging/labour/HST lines stay (they are install ranges, not motor SKUs).
- Confirm the prose mention "the 2.5 HP FourStroke portable" remains; no inline price quoted.
- Bump `dateModified` to `2026-06-03`.

## Pass 3 — Sweep the rest of `blogArticles.ts`

Targets — strings that quote a SKU-specific price (not "all-in installed" ranges):

1. **Line ~5670 (bass-boat-mercury-motor-buying-guide FAQ):** "150 Pro XS around $17,000-$18,000 dealer" → canonical is **$24,349**. Update FAQ to "150 Pro XS around $24,000-$24,500 dealer, 200 Pro XS V6 around $28,000-$30,500, 250 Pro XS V8 around $33,500-$34,500". Bump that post's `dateModified`.
2. **Line ~7121 (mercury-seapro FAQ):** "115 SeaPro roughly $1,800-$2,500 more" — SeaPro is not in canonical pricing-reference (FourStroke + Pro XS only there). **Flag for Jay**; do not invent a value. No edit.
3. **Line ~3681 (boat-motor-size-calculator FAQ):** "40HP $8,000-$10,000; 60HP CT $12,000-$14,000; 75HP $14,000-$16,000; 115HP $18,000-$21,000". Compare to canonical *dealer* prices ($9,801 / $12,342 / $14,476 / $17,083). The ranges are installed/all-in — borderline OK but high end overstates. **Leave as-is**, flag.
4. **Line ~9546 ("115 HP FourStroke | $17,500, $22,500"):** Installed all-in — within band. **Leave.**
5. **All other `$XX,XXX` hits** scanned (~620 total) are install/all-in ranges or trade-in/repair ranges. **Leave**, log in report.

## Pass 4 — Validate
- Run `npx tsc --noEmit` (well, the harness will), and `node scripts/check-blog-leaks.mjs` for hygiene.
- `node scripts/check-pricing-reference-copy.mjs` if applicable.
- Spot-grep that no remaining `$17,000-$18,000 dealer` or stale Verado MSRP rows survive.

## Out of scope
- Editing markdown twins under `public/blog/`, `public/motors/`, `public/locations/`. The user explicitly asked for blog reconciliation in `src/data/blogArticles.ts`; the twin generator can be rerun separately.
- SeaPro and Verado price updates (no canonical source).
- Recomputing every installed-all-in range table — would be sweeping and risks drift in the other direction.

## Deliverables in report
- Canonical source: `public/pricing-reference.md` (2026-06-03)
- Total `$XX,XXX` hits scanned and counts by category (SKU / range / installed-all-in / non-motor)
- Per-edit table: slug | location | OLD | NEW | reason
- Posts flagged for Jay (SeaPro, calculator FAQ wide ranges)
- tsc + leak check status