# Dropbox Image Backfill — Audit & Dry-Run Report
Date: 2026-05-01
Scope: Read-only investigation. **No DB writes. No Dropbox calls. No image invention.**

---

## TL;DR

The Dropbox sync has **already run** and already imported **431 images for 25 distinct motors** into `motor_media` (with `assignment_type='dropbox-curated'`). The "22 motors with no `image_url`/`hero_image_url`" problem is **not** a missing-Dropbox-content problem — it is a **state-propagation problem** between two columns:

- `motor_media` (the curated asset library) is partially populated.
- `motor_models.hero_image_url` / `image_url` (which `public-motors-api` reads) is **not** being written for many motors that already have curated hero rows in `motor_media`.

10 of the 22 missing-image motors **already have a curated hero image** sitting in `motor_media` that has not been promoted to `motor_models.hero_image_url`. 12 of the 22 have **zero** Dropbox content and are genuinely missing source assets.

Re-running the existing `sync-dropbox-motor-folders` Edge Function against the same parent folder is **not safe to do blindly**: the current Dropbox config row is in `sync_status='error'`, the matcher creates **3 confirmed duplicate-hero collisions** across distinct SKUs, and the function would re-download files we already have unless `replaceExisting=false` (which it defaults to, but the duplicate-collision risk is independent of that flag).

---

## 1. What function maps Dropbox filenames to `motor_models`?

**Edge Function:** `supabase/functions/sync-dropbox-motor-folders/index.ts` (994 lines).

**Algorithm:**
1. Lists subfolders under a Dropbox parent path.
2. For each subfolder, parses **HP, family, shaft, Command Thrust, ProKicker, Tiller, Pro XS, SeaPro, Verado** flags from the folder name (regex `parseFolderName`, lines 58-125).
3. Scores every `motor_models` row against the parsed folder signal (`scoreMotorMatch`, lines 128-250). Score components:
   - HP exact = +50, ±0.5 = +45, ±2 = +30
   - Shaft match = +20
   - Pro XS match/mismatch = ±35 / ±25 / ±30
   - SeaPro and Verado: same ±35/±25/±30 pattern
   - Command Thrust match/mismatch = +35 / -25, plus -20 if folder doesn't say CT but motor is CT
   - ProKicker = +40 / -30 / -25
   - Tiller (rigging-code H detection) = +30 / -25 / -20
4. Threshold: **`MIN_MATCH_SCORE = 40`**. Anything below is rejected as a weak match.
5. For images, validates "is this a detail shot" via `_shared/image-validation.ts`; the first non-detail image becomes hero.
6. Writes a row to `motor_media` (`media_category='hero'` for the chosen one, `'gallery'` or `'detail'` for the rest) and **updates `motor_models.hero_image_url` + `hero_media_id` + `media_last_updated`** (lines 924-946) — but only when `imagesSynced > 0` in that run, i.e. only when fresh files were downloaded.

**That last point is the core gap.** If `motor_media` already has a hero row from a prior run but `motor_models.hero_image_url` was never written (or was later cleared), the function does **not** repair the parent-table column on a subsequent run unless new files are downloaded.

---

## 2. Does Dropbox already contain usable images for the 22 missing motors?

**Partially.** Here's the inventory of curated-Dropbox content already in `motor_media` for each of the 22 in-stock motors with NULL image columns:

| HP | Model | Model # | Dropbox imgs in motor_media | Hero rows | Status |
|---:|---|---|---:|---:|---|
| 2.5 | 2.5MH FourStroke | 1F02201KK | 14 | 2 | ✅ Has curated hero — needs propagation |
| 9.9 | 9.9EH FourStroke | 1A10301LK | 0 | 0 | ❌ No Dropbox content |
| 9.9 | 9.9ELH FourStroke | 1A10311LK | 0 | 0 | ❌ No Dropbox content |
| 15 | 15 MH FourStroke | 1A15201LK | 0 | 0 | ❌ No Dropbox content |
| 20 | 20 EH FourStroke | 1A20301LK | 0 | 0 | ❌ No Dropbox content |
| 20 | 20 ELH FourStroke | 1A20311LK | 0 | 0 | ❌ No Dropbox content |
| 20 | 20 ELHPT FourStroke | 1A20411LK | 0 | 0 | ❌ No Dropbox content |
| 25 | 25 ELHPT FourStroke | 1A25411BK | 30 | 1 | ✅ Has curated hero — needs propagation |
| 25 | 25 ELPT FourStroke | 1A25413BK | 0 | 0 | ❌ No Dropbox content |
| 40 | 40 ELPT FourStroke | 1F40413GZ | 0 | 0 | ❌ No Dropbox content |
| 50 | 50 ELPT FourStroke | 1F51413GZ | 12 | 2 | ✅ Has curated hero — needs propagation |
| 60 | 60 ELPT Command Thrust FourStroke | 1F60453GZ | 8 | 1 | ✅ Has curated hero — needs propagation |
| 60 | 60 ELPT FourStroke | 1F60413GZ | 0 | 0 | ❌ No Dropbox content |
| 90 | 90 ELPT FourStroke | 1F904132D | 0 | 0 | ❌ No Dropbox content |
| 115 | 115 ELPT ProXS | 1117F131D | 19 | 1 | ⚠️ Has curated hero — **but shares hero file with 115 EXLPT ProXS** (see §4) |
| 115 | 115 EXLPT ProXS | 1117F231D | 31 | 2 | ⚠️ Has curated hero — **but shares hero file with 115 ELPT ProXS** (see §4) |
| 115 | 115ELPT FourStroke | 1115F132D | 0 | 0 | ❌ No Dropbox content |
| 150 | 150 ELPT ProXS | 1152F131D | 17 | 1 | ✅ Has curated hero — needs propagation |
| 150 | 150 EXLPT ProXS | 1152F231D | 0 | 0 | ❌ No Dropbox content |
| 175 | 175 EXLPT ProXS | 11750002A | 0 | 0 | ❌ No Dropbox content |
| 200 | 200 ELPT ProXS | 12000039A | 6 | 1 | ✅ Has curated hero — needs propagation |
| 250 | 250 ELPT ProXS | 12500094A | 4 | 1 | ✅ Has curated hero — needs propagation |

**Summary:**
- **8 of 22** already have a curated hero image waiting in `motor_media` that just needs a one-line UPDATE to `motor_models.hero_image_url` to start showing in `public-motors-api`.
- **2 of 22** (115 ELPT ProXS, 115 EXLPT ProXS) have a curated hero but it is the **same shared file** — needs Jay's call before promoting (see §4).
- **12 of 22** have **zero** Dropbox content. Re-running the sync against the existing parent folder **will not help these** unless new subfolders have been added in Dropbox since the last successful run.

---

## 3. Is running the existing Dropbox sync safe?

**Not without preconditions.** The current state:

- `dropbox_sync_config` has 1 row, `sync_status='error'`, `last_sync_at=NULL`, `error_message='Edge Function returned a non-2xx status code'`. The folder path stored is a Dropbox shared-link fragment (`scl/fo/usov9pqtaogvalkv2a64b/...`), not a normal `/Mercury Images` path.
- Last successful curated import wrote files at paths like `/mercury images/2.5/...`, `/mercury images/115 proxs/...`. So the historical sync ran from a different, working parent path that is **not** what's stored in `dropbox_sync_config` today.
- The function requires admin auth (`requireAdmin` on line 470) and a valid `DROPBOX_ACCESS_TOKEN` env secret. The current token state is unknown — the failing config row suggests it may be expired or the shared link became invalid.
- The function **defaults to `dryRun=true`** and `replaceExisting=false`, which is safe.

**Recommended preflight before any real run:**
1. Re-confirm `DROPBOX_ACCESS_TOKEN` is valid (try a `browse-dropbox-folders` call first).
2. Use the **original working parent path** (`/Mercury Images` or whatever produced the existing `/mercury images/...` paths in `motor_media`), not the shared-link fragment in `dropbox_sync_config`.
3. Always pass `dryRun: true` and `maxFolders: 5` initially.
4. Review the dry-run output (function returns per-folder match score + runner-up) **before** flipping to `dryRun: false`.

---

## 4. Filename / model matching risks

Confirmed collisions in **current** `motor_media` (already in DB, would be re-amplified by another sync against the same Dropbox layout):

### 🔴 Risk A — 115 ProXS shaft variants share the same hero
Both `115 ELPT ProXS` (1117F131D, 20" shaft) and `115 EXLPT ProXS` (1117F231D, 25" shaft) are pointing at the **identical Dropbox file**:
`/mercury images/115 proxs/mercury-mm-115pro-xs-fs-rear-3-4-port-1555756187460.jpg`
Reason: the Dropbox folder is named `115 ProXS` with no shaft suffix. The matcher gives both motors the same +50 (HP) +35 (Pro XS) ≈ score 85 and picks both as best match. Image is visually identical for both shaft lengths in marketing terms, but they are different SKUs and the sync as written will keep doing this.

### 🔴 Risk B — 115 Command Thrust collision (already in DB)
`/mercury images/115 ct/115hp_4s_ct_rp 3-4-1579428656006.jpg` is currently the hero for **2 different motors** (motor_ids `609932bd...` and `837317a4...`). These appear to be two CT variants. Same root cause as A.

### 🔴 Risk C — 25 ELHPT collision (already in DB)
`/mercury images/25 elhpt/...port-1665184487211.jpg` is the hero for **2 different motors**. Likely 2026 vs older CT 25 ELHPT.

### Specific risks for the user's checklist

| Pair | Risk | Notes |
|---|---|---|
| **9.9 EH vs 9.9 ELH vs 9.9 MH** | LOW (none in Dropbox) | None of these have any curated file. Dropbox sync would only help if new `9.9 EH` / `9.9 ELH` subfolders are added. The existing matcher correctly distinguishes by Tiller flag (`H` rigging) and `electric` start flag — but its only Pro XS-style line/family flags. No specific "EH vs ELH vs MH" confidence boost beyond shaft + tiller heuristics. **Manual review required** if any 9.9 folder is added. |
| **20 ELH vs 20 ELHPT** | MEDIUM | Both contain the `H` (tiller) marker, both score positively for Tiller. The differentiator is the `PT` (power trim) suffix which the parser does **not** explicitly extract. If a folder is just `20 H` or `20 Tiller`, the matcher would score both motors equally. **Manual review required**. |
| **25 ELPT vs 25 ELHPT** | MEDIUM-HIGH | The `H` in ELHPT is the tiller signal. A folder named `25` (no H) would score the non-tiller `25 ELPT` higher; a folder named `25 ELHPT` would correctly land on the tiller. The current Dropbox layout `25 elhpt/` correctly maps to `25 ELHPT FourStroke`. But there is no Dropbox folder for `25 ELPT` (non-tiller), so that motor stays empty. **No collision today, but watch out for any future plain `25` folder.** |
| **60 ELPT vs 60 Command Thrust** | RESOLVED in current data | `60 CT` folder correctly mapped to `60 ELPT Command Thrust FourStroke` (score 85). The plain `60 ELPT FourStroke` has no Dropbox content. The CT-vs-non-CT scoring (±35 for match, -20 for plain folder mapping to CT motor) is robust. |
| **115 FourStroke vs 115 ProXS** | RESOLVED in scoring | The `Pro XS` flag carries ±35/-25 weight, so `115ELPT FourStroke` would not steal a `115 ProXS` folder. But `115ELPT FourStroke` has no curated content because there is no `115 FourStroke` Dropbox folder. **Manual photo source needed** for this SKU. |
| **150 ELPT vs 150 EXLPT ProXS** | HIGH (predictable collision) | Same shape as Risk A. `150 ELPT ProXS` already has a curated hero from `/mercury images/150 proxs/`. `150 EXLPT ProXS` (25" shaft) has zero curated content. If we re-run the sync today, the matcher will assign the **same** `150 ProXS` folder hero to **both** SKUs, exactly like the 115 ProXS collision. **Sync-the-shaft suffix into folder names** is the only clean fix. |

---

## 5. Dry-run report — proposed actions per motor

**Action key:**
- `PROMOTE` = curated hero already exists in `motor_media`; one-line UPDATE to `motor_models.hero_image_url` would fix the public API. **No Dropbox call needed.**
- `PROMOTE-WITH-REVIEW` = same, but the chosen hero is a shared/duplicated file across SKUs; needs Jay's go-ahead.
- `DROPBOX-SYNC` = no curated content exists; would require either a new Dropbox subfolder added by Jay or an alternative source (Mercury brochure render, on-lot photo).
- `MANUAL` = collision risk too high for matcher to resolve safely; needs human pick.

| HP | Model | Model # | Action | Proposed source | Confidence | Manual review? |
|---:|---|---|---|---|:---:|:---:|
| 2.5 | 2.5MH FourStroke | 1F02201KK | PROMOTE | `motor_media` hero (`Mercury-Marine-25-HP-Rear-Port-3-4-1623160311071.jpg`) | HIGH | No |
| 9.9 | 9.9EH FourStroke | 1A10301LK | DROPBOX-SYNC | n/a — Jay must add `9.9 EH` Dropbox folder OR provide on-lot photo | n/a | **Yes** |
| 9.9 | 9.9ELH FourStroke | 1A10311LK | DROPBOX-SYNC | n/a — Jay must add `9.9 ELH` Dropbox folder OR on-lot photo | n/a | **Yes** |
| 15 | 15 MH FourStroke | 1A15201LK | DROPBOX-SYNC | n/a | n/a | **Yes** |
| 20 | 20 EH FourStroke | 1A20301LK | DROPBOX-SYNC | n/a | n/a | **Yes** |
| 20 | 20 ELH FourStroke | 1A20311LK | DROPBOX-SYNC | n/a — careful folder naming needed (see §4) | n/a | **Yes** |
| 20 | 20 ELHPT FourStroke | 1A20411LK | DROPBOX-SYNC | n/a — careful folder naming needed | n/a | **Yes** |
| 25 | 25 ELHPT FourStroke | 1A25411BK | PROMOTE-WITH-REVIEW | `motor_media` hero — file is shared with another 25 ELHPT row (Risk C) | MEDIUM | **Yes** |
| 25 | 25 ELPT FourStroke | 1A25413BK | DROPBOX-SYNC | n/a | n/a | **Yes** |
| 40 | 40 ELPT FourStroke | 1F40413GZ | DROPBOX-SYNC | n/a (40 CT version already has `image_url` populated) | n/a | **Yes** |
| 50 | 50 ELPT FourStroke | 1F51413GZ | PROMOTE | `motor_media` hero (`530b8e30fd84100700833b8f-large.jpg`) | HIGH | No |
| 60 | 60 ELPT Command Thrust FourStroke | 1F60453GZ | PROMOTE | `motor_media` hero (`7f943efd-...-1579429778199.jpg`) | HIGH | No |
| 60 | 60 ELPT FourStroke | 1F60413GZ | DROPBOX-SYNC | n/a | n/a | **Yes** |
| 90 | 90 ELPT FourStroke | 1F904132D | DROPBOX-SYNC | n/a (90 CT has `image_url`) | n/a | **Yes** |
| 115 | 115 ELPT ProXS | 1117F131D | PROMOTE-WITH-REVIEW | `motor_media` hero — shared with 115 EXLPT ProXS (Risk A) | MEDIUM | **Yes** |
| 115 | 115 EXLPT ProXS | 1117F231D | PROMOTE-WITH-REVIEW | `motor_media` hero — shared with 115 ELPT ProXS (Risk A) | MEDIUM | **Yes** |
| 115 | 115ELPT FourStroke | 1115F132D | DROPBOX-SYNC | n/a — no `115 FourStroke` Dropbox folder | n/a | **Yes** |
| 150 | 150 ELPT ProXS | 1152F131D | PROMOTE | `motor_media` hero (`6362c63f-...-1570131083110.jpg`) — currently sole owner | HIGH | No |
| 150 | 150 EXLPT ProXS | 1152F231D | DROPBOX-SYNC | If we re-run the sync from existing `/mercury images/150 proxs/`, it will collide with `150 ELPT ProXS` (Risk A pattern). **Recommend renaming Dropbox folder to `150 EXLPT ProXS`** before any re-sync, or skip sync and use brochure render for the EXLPT shaft. | LOW | **Yes** |
| 175 | 175 EXLPT ProXS | 11750002A | DROPBOX-SYNC | n/a | n/a | **Yes** |
| 200 | 200 ELPT ProXS | 12000039A | PROMOTE | `motor_media` hero (`mercury-200hp-v8-proxs-fs-port-side-...`) | HIGH | No |
| 250 | 250 ELPT ProXS | 12500094A | PROMOTE | `motor_media` hero (`250hp_v8_proxs_fs_port_side.jpg`) | HIGH | No |

---

## Recommendations (no actions taken)

### Tier 1 — Zero-risk, biggest win (needs Jay's nod, no Dropbox needed)
**Promote 6 HIGH-confidence existing curated heroes** to `motor_models.hero_image_url` via a single targeted UPDATE migration:
- 2.5MH FourStroke
- 50 ELPT FourStroke
- 60 ELPT Command Thrust FourStroke
- 150 ELPT ProXS
- 200 ELPT ProXS
- 250 ELPT ProXS

This drops the public-motors-api null-image count from 22 to 16 with zero new image content and zero matcher risk. The hero rows are already chosen by the existing scorer; we'd just be back-filling the parent column.

### Tier 2 — Needs Jay's call
**3 PROMOTE-WITH-REVIEW** (25 ELHPT, 115 ELPT ProXS, 115 EXLPT ProXS): the curated hero exists but is a shared file. Two paths:
   a) Accept the shared image (Mercury marketing image is identical for shaft variants — defensible),
   b) Wait for shaft-specific photos.

### Tier 3 — Genuinely missing assets
**12 motors with zero Dropbox content.** No safe way to fix via re-sync alone. Options for Jay:
   a) Add new shaft- and tiller-specific Dropbox subfolders (`9.9 EH`, `9.9 ELH`, `20 EH`, `20 ELH`, `20 ELHPT`, `25 ELPT`, `40 ELPT`, `60 ELPT`, `90 ELPT`, `115 FourStroke`, `150 EXLPT ProXS`, `175 EXLPT ProXS`) — then re-run the sync targeting the parent folder.
   b) Source from Mercury Marine official brochure renders (licensing question for Jay).
   c) Take on-lot photos.

### Matcher hardening (not in scope today, flag only)
- The matcher does not extract the `PT` (power trim) suffix as a distinct flag. `parseFolderName` should be extended if Jay wants `20 ELH` and `20 ELHPT` distinguished by anything other than tiller heuristics.
- The matcher never inspects shaft information from the folder name beyond a single `\b(XXL|CXL|XL|L)\b` match. `EXLPT` is not detected as `XL` because the regex requires word boundaries. This is the root cause of every `ProXS` shaft collision. Adding `EXL` / `EXLPT` to the regex would resolve Risks A & D for `150 ProXS`.

### Dropbox config repair
- `dropbox_sync_config` row has a stale shared-link path and `sync_status='error'`. Reset before any new sync attempt.

---

## What this audit explicitly did NOT do

- ❌ No DB writes.
- ❌ No Dropbox API calls.
- ❌ No image generation, scraping, or stock images.
- ❌ No changes to `public-motors-api`, the matcher, the inventory rules, or the pricing hierarchy.
- ❌ No matcher regex changes (just flagged for follow-up).
- ❌ No `motor_models.hero_image_url` writes.

Every observation above is read from the existing `motor_models` and `motor_media` tables and the existing `sync-dropbox-motor-folders` source code.

---

## Recommended next decision (for Jay)

**Approve Tier 1 only?** That's the smallest, lowest-risk change: a single UPDATE migration that promotes 6 existing curated heroes into `motor_models.hero_image_url`, immediately reducing the public-feed null-image count from 22 → 16. No matcher run, no Dropbox call, no image invention. Reversible by setting the 6 columns back to NULL.

Tier 2 and Tier 3 require business decisions (shared image acceptable? brochure-render licensing? on-lot photo session?) before any code or DB action.
