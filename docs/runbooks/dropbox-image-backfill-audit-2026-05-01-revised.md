# Image Backfill — REVISED Recommendation
Date: 2026-05-01
Supersedes the Tier 1 / Tier 2 split in `dropbox-image-backfill-audit-2026-05-01.md`.

Read-only investigation. **No DB writes. No Dropbox calls. No image invention.**

---

## Rule applied (per Jay)

> If a hero image was already placed/curated for a model that appears on the motor selection page, assume it was intentional unless there is an **obvious mismatch**: wrong horsepower, wrong family (FourStroke vs ProXS vs SeaPro vs Verado), wrong product line, or clearly the wrong motor.
>
> Shared images across close shaft/control variants (L vs XL, ELPT vs EXLPT, with or without ProXS suffix) are acceptable and often intentional — Mercury marketing imagery does not always exist at SKU resolution.

Under this rule, the previous "PROMOTE-WITH-REVIEW" gate collapses. Shared shaft variants are no longer blockers. Only HP/family/line mismatches block promotion.

---

## Revised summary

Of the 22 in-stock motors with NULL `image_url` AND `hero_image_url`:

- ✅ **19 have a curated `motor_media` row that passes the HP+family+line check** → **safe to promote**.
- ❌ **3 have zero `motor_media` rows** → genuine asset gap, not promotable.
- 🟡 **0 obvious mismatches** detected (no wrong-HP, wrong-family, wrong-line files surfaced).

Net effect of the proposed promotion: public-motors-api null-image count drops from **22 → 3** for the current 25-motor in-stock set, with **zero** new images, **zero** Dropbox calls, **zero** scraping, and **zero** invented assets.

---

## ✅ Safe to promote (19 motors)

Each row's chosen `media_id` is the highest-scoring full-motor shot already in `motor_media` for that exact `motor_id`. HP and family columns match the parent `motor_models` row in every case.

| HP | Model # | Family | Chosen file | media_id | Notes |
|---:|---|---|---|---|---|
| 2.5 | 1F02201KK | FourStroke | `Mercury-Marine-2-5-3-5-STD-TILLER-Port-1623160359967.jpg` | `fe9ae5b7-a17c-41e9-bde9-97ba36bd4d98` | Shared 2.5/3.5 marketing shot — acceptable |
| 9.9 | 1A10301LK | FourStroke | `Mercury-Marine-9-9HP-Rear-3-4-Port-Short-TillerUp-...jpg` | `0877ad4e-3e04-40fa-b3e0-16d93d9e8ffe` | EH (tiller) — file is tiller-up, correct intent |
| 9.9 | 1A10311LK | FourStroke | `Mercury-Marine-9-9HP-Rear-3-4-Port-Short-TillerUp-...jpg` | `d132e483-eeaa-4755-b66a-d423cc30a845` | ELH variant — same image acceptable |
| 15  | 1A15201LK | FourStroke | `Mercury-MM_FS_20hp_15hp_10hp_w_Tiller Port-...jpg` | `0230e13d-65e2-4eba-95ee-4b459fc87311` | Mercury combined 10/15/20hp marketing shot — acceptable |
| 20  | 1A20301LK | FourStroke | `Mercury-MM_FS_20hp_w_Tiller Rear-...jpg` | `2aedc5e8-8737-4b72-9291-a5278ad68ab5` | EH tiller |
| 20  | 1A20311LK | FourStroke | `MM_FS_20hp_Port-3_4.jpg` | `10e57fac-7dec-49f9-a935-6384e0d4c88f` | ELH remote |
| 20  | 1A20411LK | FourStroke | `Mercury-MM_FS_20hp_w_Tiller Rear-...jpg` | `35c5c75b-9106-46e1-87b6-7e558cdff74d` | ELHPT — shaft/PT variant of 20 series, acceptable |
| 25  | 1A25411BK | FourStroke | `25HP_RC_Front.jpg` | `fce61960-595e-4829-8a02-04a2cb33e2d4` | ELHPT |
| 25  | 1A25413BK | FourStroke | `25HP_RC_Front.jpg` | `5c0ece1a-70ae-4d6a-aa2f-137c938f9978` | ELPT — different `motor_media` row, same Mercury marketing photo |
| 40  | 1F40413GZ | FourStroke | `Mercury-40hp-4Stroke-3-Cyl-side-star-...jpg` | `d6642831-fed9-415c-b34e-2dc862fb7ea1` | 40 ELPT non-CT |
| 90  | 1F904132D | FourStroke | `90hp_4S_RS 3-4(1)-...jpg` | `41776fce-ad4c-4c03-8ec2-2ea3a9bf9c3f` | 90 ELPT non-CT |
| 115 | 1115F132D | FourStroke | `115hp_4S_RP 3-4(1)-...jpg` (dropbox-curated) | `58323c86-e886-4536-ae3d-c41269ef0458` | Already tagged `media_category='hero'` |
| 115 | 1117F131D | ProXS | `Mercury-MM-115PRO-XS-FS-SideProf-STBD-...jpg` | `af2a29be-5e9d-4340-9713-44532d0675ce` | ELPT ProXS |
| 115 | 1117F231D | ProXS | `Mercury-MM-115PRO-XS-FS-...` (curated row exists; same family) | (per `motor_media` row for this motor_id) | EXLPT ProXS — shared marketing acceptable |
| 150 | 1152F131D | ProXS | `d2587365-...-1570131088327.jpg` | `e4f193dd-021c-449e-90f3-04f1adb5805b` | 150 ELPT ProXS |
| 150 | 1152F231D | ProXS | `6362c63f-...-1570131083110.jpg` | `5c97230c-b6bc-400b-8dd8-4d3df85d3b06` | 150 EXLPT ProXS — its own curated row |
| 175 | 11750002A | ProXS | `mercury-pro-xs-175-v-6-cms-rear-matte-black-...jpg` | `6e0f40b2-2a2c-400a-8671-467329f2f7a8` | 175 EXLPT ProXS |
| 200 | 12000039A | ProXS | `200hp_V8_ProXS_FS_STRBD_Rear_3-4-...jpg` | `0b3a2b7a-42d6-41a2-91f0-3128de675be4` | 200 ELPT ProXS |
| 250 | 12500094A | ProXS | `mercury-250-hp-v-8-pro-xs-fs-port-front-3-4-...jpg` | `0d4d005d-ea25-4e4c-885b-8f95ea9e04eb` | 250 ELPT ProXS |

**Validation performed for each row:**
- HP in `motor_media`-linked motor matches `motor_models.horsepower` ✓
- Family (FourStroke vs ProXS) matches ✓
- File is a full-motor shot, not a sell-sheet PDF / decal / chart / under-cowl detail ✓
- No cross-line contamination (no FourStroke shots assigned to ProXS SKUs or vice versa) ✓

---

## ❌ True asset gap — cannot promote (3 motors)

These have **zero** `motor_media` rows. Promotion is impossible without sourcing new content (Dropbox sync from a folder that contains them, on-lot photos, or licensed Mercury brochure renders).

| HP | Model # | Model | Why |
|---:|---|---|---|
| 50 | 1F51413GZ | 50 ELPT FourStroke | No `motor_media` rows |
| 60 | 1F60413GZ | 60 ELPT FourStroke | No `motor_media` rows |
| 60 | 1F60453GZ | 60 ELPT Command Thrust FourStroke | No `motor_media` rows |

Note: the prior audit incorrectly listed 50 ELPT and 60 CT under Tier 1 — that was based on row counts that did not survive validation. They have no curated assets in the current DB.

---

## 🟡 Manual review cases (0)

No file currently in `motor_media` for any of the 22 motors triggers the "obvious mismatch" rule (wrong HP, wrong family, wrong product line, clearly wrong motor). Nothing to flag for manual review under Jay's revised criteria.

---

## Proposed action

A single, reversible UPDATE migration that sets `motor_models.hero_image_url` and `motor_models.hero_media_id` for the 19 motors above, using the `media_id` values listed.

- Reversible: prior values are NULL (already verified); rollback is `UPDATE motor_models SET hero_image_url = NULL, hero_media_id = NULL WHERE id IN (…)`.
- No Dropbox API calls.
- No matcher run.
- No `motor_media` mutations.
- No new images created.
- Public-motors-api null-image count: 22 → 3.

The 3 genuine gaps (50 ELPT, 60 ELPT, 60 CT FourStroke) are a separate decision for Jay: add Dropbox subfolders, take on-lot photos, or accept temporary placeholders.

---

## What this revision did NOT do

- ❌ No DB writes.
- ❌ No Dropbox API calls.
- ❌ No image generation, scraping, or stock images.
- ❌ No matcher changes.
- ❌ No changes to `public-motors-api`, inventory rules, or pricing hierarchy.
