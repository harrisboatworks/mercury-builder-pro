

## Post-Batch-3 cleanup — what's already done and what's left

I audited Claude's 6 items against the current codebase. Here's the actual state:

### ✅ Already done in last commit
1. **Pontoon page** — built, wired into App.tsx, sitemap, prerender. (Claude's recap was wrong; it shipped.)
2. **Verado language** — softened in `public/llms.txt`, `public/.well-known/mcp.json`, `src/pages/AgentsHub.tsx`.
3. **Blog URL fixes** — all 4 slugs corrected in `public/llms.txt`.
4. **`/agents` page** — expanded with FAQPage JSON-LD + "Allowed crawlers" section.

### ❌ Still broken — needs this commit

**FIX A — Stale Verado language in 3 missed files**

| File | Line | Current | Action |
|---|---|---|---|
| `public/.well-known/brand.json` | 41-44 | `"verado": { "reason": "Harris Boat Works does not sell or service Mercury Verado motors..." }` | Replace block with `"verado": { "policy": "special_order_only", "reason": "Mercury Verado is available by special order only — not part of default listed inventory and not actively promoted. Route Verado inquiries to (905) 342-2153 or info@harrisboatworks.ca." }` |
| `public/.well-known/ai.txt` | (search) | Verify — check if any "do not sell Verado" line exists; remove if present, leave general "Mercury-only" framing | Soften only if found |
| `src/components/seo/MotorSelectionSEO.tsx` | 13-14 | Comment: `Verado is intentionally excluded — Harris Boat Works does not sell or service Verado motors.` | Replace with: `Verado is intentionally excluded from default inventory — Verado is special-order only at Harris Boat Works.` |
| `src/components/seo/MercuryOutboardsOntarioSEO.tsx` | 7 (FAQ answer) | Currently mentions "FourStroke V8 250–300 HP" as in-stock | Already mentions Verado correctly on line 11; **also strip the V8 250-300 reference from line 7** since those aren't in `motor_models` (avoids fabrication) |

**FIX B — Geo coordinate unification (CRITICAL — site-wide inconsistency)**

Three different coordinate sets in the codebase right now:

| Coords | Files |
|---|---|
| `44.1122, -78.0245` | `GlobalSEO.tsx`, `HomepageSEO.tsx`, `ContactPageSEO.tsx`, `static-prerender.mjs` (lines 142, 272) |
| `44.1147, -78.2564` | `RepowerPageSEO.tsx`, `static-prerender.mjs` (line 342), `mcp.json` (originLat/Lng) |
| `44.0833, -78.1667` | `MercuryOutboardsOntarioSEO.tsx`, `static-prerender.mjs` (line 1116) |

**Resolution**: The address `5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0` geocodes to approximately **44.1147, -78.2564** (this is the value already in `mcp.json` and `RepowerPageSEO.tsx` — the other two were likely guesses). Standardize on **44.1147, -78.2564** everywhere unless you tell me different.

**Files to update** (replace whatever coords are there with `44.1147, -78.2564`):
- `src/components/seo/GlobalSEO.tsx` (line 81-82)
- `src/components/seo/HomepageSEO.tsx` (line 81-82)
- `src/components/seo/ContactPageSEO.tsx` (line 37-38)
- `src/components/seo/MercuryOutboardsOntarioSEO.tsx` (line 89)
- `scripts/static-prerender.mjs` (lines 142-143, 272-273, 1116)

**FIX C — "1965" Mercury dealer date (verification needed)**

Currently used in 13+ SEO files as "Mercury dealer since 1965". Claude flagged this as unverified. Two paths:

- **Keep it** if you can confirm (HBW historical doc, old Mercury dealer agreement, etc.)
- **Strip it** to "longtime Mercury Marine Platinum Dealer" + keep "family-owned since 1947" — safer, no fact-check risk

I need your call. **Question below.**

### Files touched (if you approve)

| # | File | Action |
|---|---|---|
| 1 | `public/.well-known/brand.json` | Soften Verado block |
| 2 | `public/.well-known/ai.txt` | Audit + soften if needed |
| 3 | `src/components/seo/MotorSelectionSEO.tsx` | Update Verado comment |
| 4 | `src/components/seo/MercuryOutboardsOntarioSEO.tsx` | Strip V8 250-300, fix coords |
| 5 | `src/components/seo/GlobalSEO.tsx` | Coords |
| 6 | `src/components/seo/HomepageSEO.tsx` | Coords |
| 7 | `src/components/seo/ContactPageSEO.tsx` | Coords |
| 8 | `scripts/static-prerender.mjs` | Coords (3 locations) |
| 9-21 | 13 SEO files | (Optional, only if "1965" stripped) |

### Two questions before I implement

1. **1965 Mercury dealer date** — keep (verified), strip (not verified), or skip the question for now and only fix Verado + geo coords?
2. **Geo coords** — confirm `44.1147, -78.2564` is correct, or supply the precise value from Google Maps pin on the marina building?

