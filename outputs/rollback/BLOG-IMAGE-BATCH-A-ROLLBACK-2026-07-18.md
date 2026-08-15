# Blog Image Batch A — rollback and provenance

Date: 2026-07-18

Branch: `codex/blog-image-batch-a-2026-07-17`

Baseline: `d3f00c02d7cc7fa217d6fe0703c9c63b4dc34155`

## Scope

This batch only adds hero images and accurate alternative text to five English articles that previously had no explicit hero image. It does not change article copy, pricing, metadata dates, routes, components, or translated articles. No existing image file is overwritten.

| Article slug | Previous image | New image |
| --- | --- | --- |
| `why-harris-boat-works-mercury-dealer` | none | `/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` |
| `mercury-75-vs-90-vs-115-comparison` | none | `/lovable-uploads/blog-heroes-2026-07/hero-mercury-75-90-115-official-freshwater-2026-07.webp` |
| `pontoon-vs-v-hull-comparison-ontario` | none | `/lovable-uploads/blog-heroes-2026-07/hero-pontoon-vs-vhull-official-freshwater-2026-07.webp` |
| `mercury-outboard-spring-run-up-checklist-ontario` | none | `/lovable-uploads/blog-heroes-2026-07/hero-mercury-spring-run-up-hbw-service-2026-07.webp` |
| `repair-repower-or-sell-boat-ontario-decision-guide` | none | `/lovable-uploads/blog-heroes-2026-07/hero-repair-repower-sell-hbw-real-2026-07.webp` |

## Source provenance

The Mercury lifestyle files were downloaded from the authenticated Mercury Marine dealer photography portal and were confirmed there as freshwater assets. The 75, 90 and 115 HP motors are all below the 300 HP project limit. Composites use crops of the original photographs only; no engine, cowl, logo, person, boat or water was generated or redrawn.

| Source | Use | SHA-256 |
| --- | --- | --- |
| `LundBoats_Alaskan_WaterfowlShoot_2023-531.jpg` | official 75 HP freshwater panel | `e86332f5e95326d651ddadd53e807cb1c57a90fa1f7bb62f67b40da2ceb783ac` |
| `LundBoats_Alaskan_WaterfowlShoot_2023-527.jpg` | official freshwater V-hull panel | `0485fd371a2083dd945c1cae708bfe6879a20c8862397d1827c5b2caaa5704cd` |
| `MM_90hp-CT_FS_20UC_G8A4663.jpg` | official 90 HP Command Thrust freshwater pontoon panels | `f402c0b981d9cd74a25afb192bd8bf5defe969175defdfadc882505309702d9f` |
| `230_Sunsation_Angler_115hp_PRM6721_0460.jpg` | official 115 HP freshwater panel | `0d0d459fd0cdaf44f02c73423f431ee2e57b4d055afc5dd88544183d5140db62` |
| `src/assets/repower-hbw-shop-install.jpg` | real HBW installation/service scene | `43983acb48282dc942d7de74238f7624732b77c8cc90064402cad9e2bc3e7098` |
| `public/lovable-uploads/inline/inline-aging-boat-transom.webp` | real older Mercury and worn transom | `002d2bc2d60806903e789c34e4437c36db6e12982b63aba7c64fed8cab4581d2` |
| `public/lovable-uploads/hero-best-marina-rice-lake-ontario.png` | real HBW marina aerial | `102bc507a2250cd193b9c8e8a802fe9990a11a5ea904fc4b91f80313f6c694db` |

## Generated asset checksums

All outputs are 1600 × 900 WebP files.

| Output | Bytes | SHA-256 |
| --- | ---: | --- |
| `hero-mercury-75-90-115-official-freshwater-2026-07.webp` | 266476 | `56b12c3ab01a77d5dac92f75eb3713b11a47f88bc52767406c90d421a6c565e9` |
| `hero-mercury-spring-run-up-hbw-service-2026-07.webp` | 145490 | `0d2e9fd78d3c38d4d6f2cc4152947d1a54c5d5fd242cbcb89b2d81293fd2c376` |
| `hero-pontoon-vs-vhull-official-freshwater-2026-07.webp` | 306730 | `991b5ab0d2271e05e10eb1614fc26a22d19996bd218250213110cc26de1c3c59` |
| `hero-repair-repower-sell-hbw-real-2026-07.webp` | 240150 | `efd0f1301ea0da44e845cbd4bbe464738962b2c1f00897cd25c2fb7f6ffacf9f` |
| `hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` | 310818 | `d767174127a84c62cad3222837d25b4040f9567739ad0c8bf00fa037034be190` |

## Rollback

Preferred rollback after merge: revert this batch's single commit. Because the batch only adds five data fields pairs and five uniquely named files, the revert will restore the prior `none` hero state without touching unrelated blog or site work.

Before merge, discard the branch or delete the five `image` / `imageAlt` field pairs and the directory `public/lovable-uploads/blog-heroes-2026-07/`. Do not use `git reset --hard` on the working repository.

## Verification record

- Focused article-to-asset mapping: **5/5 passed**. Each changed slug has one `image`, one descriptive `imageAlt`, and a present non-empty file.
- TypeScript project build (`tsc -b`): **passed**.
- Vite production build: **passed**, 4,202 modules transformed.
- In-app browser desktop render at 1440 × 1000: **5/5 passed**. Every hero loaded with `naturalWidth=1600`, `naturalHeight=900`, and remained inside the 16:9 article frame.
- In-app browser phone render at 390 × 844: **5/5 passed**. Every hero rendered at 356 × 199 CSS pixels; the new assets introduced no horizontal overflow.
- Hero-specific browser warning/error check: **passed**, no entries for `blog-heroes-2026-07`.
- Repository blog schema validator: **one pre-existing unrelated failure** in `mercury-command-thrust-complete-guide-2026` for an em dash. This batch does not touch that article or character.
- Isolated sparse-checkout preview note: an unrelated header logo stored elsewhere in `public/` was not materialized in the verification clone. The five tested hero assets themselves all loaded and were visually inspected.
