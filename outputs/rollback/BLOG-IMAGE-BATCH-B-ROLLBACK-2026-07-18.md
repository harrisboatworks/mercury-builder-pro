# Blog Image Batch B — rollback and provenance

Date: 2026-07-18

Branch: `codex/blog-image-batch-b`

Baseline: `f3cff66`

## Scope

This batch replaces eight weak or mismatched English blog hero images with authentic Mercury photography. It does not change article copy, pricing, routes, components, metadata dates, or translated articles. No existing image file is overwritten.

| Article slug | Previous image | New image |
| --- | --- | --- |
| `electric-vs-gas-repower-guide-rice-lake` | `/lovable-uploads/Mercury_Avator_and_The_Future_Blog_Post_Hero_Image.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-avator-vs-fourstroke-freshwater-2026-07.webp` |
| `best-mercury-outboard-pontoon-boats` | `/lovable-uploads/hero-best-mercury-pontoon.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-mercury-pontoon-90ct-freshwater-2026-07.webp` |
| `mercury-avator-electric-boating-ontario` | `/lovable-uploads/Mercury_Avator_and_The_Future_Blog_Post_Hero_Image.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-avator-electric-boating-battery-freshwater-2026-07.webp` |
| `mercury-40-vs-60-hp-outboard-ontario` | `/lovable-uploads/hero-mercury-40-vs-60-hp-comparison.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-mercury-40-vs-60-official-photo-comparison-2026-07.webp` |
| `mercury-90-hp-fourstroke-review-ontario` | `/lovable-uploads/Best_Mercury_Outboard_Aluminum_Fishing_Boats.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-mercury-90-fourstroke-freshwater-review-2026-07.webp` |
| `mercury-avator-7-5e-review` | `/lovable-uploads/avator-7-5e-hero-real.jpg` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-avator-7-5e-battery-freshwater-2026-07.webp` |
| `best-pontoon-outboard-2026-mercury` | `/lovable-uploads/hero-best-pontoon-outboard-2026-mercury.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-pontoon-outboard-115-freshwater-2026-07.webp` |
| `mercury-90-vs-115-hp-which-outboard-is-right-for-your-ontario-boat` | `/lovable-uploads/hero-mercury-90-shop-shot.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-mercury-90-vs-115-official-freshwater-2026-07.webp` |

Two audited service articles remain deliberately unchanged: `mercury-water-pump-replacement-cost-ontario` and `mercury-impeller-replacement-when-they-fail`. No authentic HBW water-pump or impeller service photography was available, and a generic stock or generated replacement would be less accurate than holding the current image.

## Source provenance

The Mercury lifestyle files were downloaded from the authenticated Mercury Marine dealer photography portal. Portal metadata was checked for the specific Avator 7.5e, 40 HP FourStroke, 60 HP FourStroke, 90 HP Command Thrust FourStroke, and 115 HP FourStroke photography. The selected scenes are freshwater, and every motor shown is 115 HP or below. Composites use crops of the original photographs plus one existing exact 60 HP product cutout; no engine, cowl, logo, person, boat, or water was generated or redrawn.

| Source | Mercury portal asset ID | Use | SHA-256 |
| --- | --- | --- | --- |
| `MERC24_W2F_Avator-Tracker_fishing_7963-Enhanced-NR.jpg` | `36efe1fe-ff80-46ed-88a3-7a0ff7dccfee` | Avator 7.5e battery/freshwater hero | `152fa19f9ca78e61cf3386bd9332e3144b947f8e7030fb017037684cc3de5d2a` |
| `MERC24_W2F_Avator-Tracker_fishing_8044-Enhanced-NR.jpg` | `a7bbedc9-f957-44b9-8489-c47dd7bcd91c` | Avator motor and battery-bag panel | `79bbd32dea3fcbb2b6ef3ffb8a151104590c8048c07c2d33c1dda499798300d0` |
| `MERC24_W2F_Avator-Tracker_fishing_8052-Enhanced-NR.jpg` | `2155d234-93c5-4d12-ba18-76b6968d0f60` | Avator portable battery hero | `265cab6ccc5418dff25a9f2e0ec410b02a134523b2f57bfa23968aab7ca43f64` |
| `MM_60hp_FS_Tracker_FW__TCTShots-12.jpg` | `61ee1731-6014-465e-966c-b6b4871dac36` | 60 HP FourStroke gasoline panel in the electric-versus-gas hero | `292065c1a3bc67aa11550020da1fb9c64e3e00e33ae292357d541b02e96e8ea6` |
| `MM_90hp-CT_FS_20UC_G8A4663 (1).jpg` | `2cf7d014-6b5b-44c2-8bed-2be42d7330c3` | 90 HP Command Thrust freshwater pontoon scenes | `f402c0b981d9cd74a25afb192bd8bf5defe969175defdfadc882505309702d9f` |
| `MM_90hp-CT_FS_20UC_G8A4718.jpg` | `0c2ece31-877b-46a7-b9f5-4b71fac340f8` | 90 HP Command Thrust freshwater pontoon scenes | `906e6b4be90c46c7b03c984c6a625e3736febab52653e2bc3d29f3f9601368c5` |
| `230_Sunsation_Angler_115hp_PRM6721_0460 (1).jpg` | `51871c99-19cf-4a3f-9e02-87353ff494a8` | 115 HP freshwater pontoon scenes | `0d0d459fd0cdaf44f02c73423f431ee2e57b4d055afc5dd88544183d5140db62` |
| `230_Sunsation_Angler_115hp_PRM6721_0399.jpg` | `815e7605-ce7f-4e65-bbb9-9ccfd4f74798` | 115 HP freshwater pontoon scenes | `f2f4dbd19a5a901fdd7f0a4a3c054408109543415a15e7dd76ae96d9b09b7bbc` |
| `CDN_Tradition_Aug_2021__101.jpg` | `f35c520a-853c-4556-a6b0-a29426f4b98c` | 40 HP FourStroke freshwater comparison panel | `939809efcd6e27e8a49d4cb2687d89b2d4ac87d23711a3e8c8508cc55ca9b23b` |
| `public/asset-gap-heroes/60-elpt-fourstroke.jpg` | existing tracked site asset | exact 60 HP FourStroke product cutout | `c65750d6ab03816af3ee366147517b58b43794685ed54991e1ff7338b6605a44` |

## Generated asset checksums

All outputs are 1600 × 900 WebP files.

| Output | Bytes | SHA-256 |
| --- | ---: | --- |
| `hero-avator-7-5e-battery-freshwater-2026-07.webp` | 229090 | `80b17a4a09b3ca882dd09e374743c7ed2c83b2ddf2d18c75981223d1d67bd360` |
| `hero-avator-electric-boating-battery-freshwater-2026-07.webp` | 156860 | `74487c8d95309d843b984c99f807b57660fe98185cdcd7196e7e23d894ee5334` |
| `hero-avator-vs-fourstroke-freshwater-2026-07.webp` | 151836 | `3d2e43367dc331efd5c2ffb75604e2e0e5649584eea217a25ef84c80b8679c5c` |
| `hero-best-mercury-pontoon-90ct-freshwater-2026-07.webp` | 341476 | `ff6eee156511984684acf5503b6156eaeeaecfc23c059b7e4a2007b38ade720a` |
| `hero-best-pontoon-outboard-115-freshwater-2026-07.webp` | 171850 | `0a1671de002e5df738fee384ce3900b44ab81029baa28205a1f029fac54ef501` |
| `hero-mercury-40-vs-60-official-photo-comparison-2026-07.webp` | 109440 | `a234d7b62b86129d974eb3bb62938d3514343b146bde7c784b9e09b540cf71d4` |
| `hero-mercury-90-fourstroke-freshwater-review-2026-07.webp` | 344054 | `cded853a599d0c4d49d2a52f6368a791f276f4ffe35463e28c1bd79e2cb423ac` |
| `hero-mercury-90-vs-115-official-freshwater-2026-07.webp` | 294770 | `2a8caebddd9dfe173a78c4f4163b80b8e070241c8e2ca717d7e07e56f4907059` |

Across the eight article mappings, the referenced hero files fall from 23,793,597 bytes to 1,799,376 bytes, a 92.4% reduction before transport compression. One previously tiny Avator JPEG becomes larger for materially better clarity; the other seven mappings shrink substantially.

## Rollback

Preferred rollback after merge: revert this batch's single commit. Because the batch only changes eight `image`/`imageAlt` field pairs and adds eight uniquely named files, the revert restores every prior hero without touching unrelated blog or site work.

Before merge, discard the branch or restore the eight field pairs and remove only `public/lovable-uploads/blog-heroes-2026-07/batch-b/`. Do not use `git reset --hard` on the working repository.

## Verification record

- Focused article-to-asset mapping: **8/8 passed**. Every changed slug has the intended image, accurate alternative text, and a present non-empty file.
- Image dimensions and checksums: **8/8 passed**. Every output is a 1600 × 900 WebP and matches the recorded byte count and SHA-256.
- Repository checks: asset existence, pre-publish leak, responsive-image, pricing drift, timeline, structured-data, and production build checks **passed**. The production build transformed 4,203 modules and prerendered 378 routes. The blog schema validator retains one pre-existing unrelated em dash in `mercury-command-thrust-complete-guide-2026`; this batch does not touch that article.
- Open Graph and X/Twitter image metadata: **8/8 passed** in prerendered HTML.
- In-app browser desktop render at 1440 × 1000: **8/8 passed**. Every hero loaded at `naturalWidth=1600` and `naturalHeight=900`, rendered within the 16:9 article frame, and introduced no horizontal overflow.
- In-app browser phone render at 390 × 844: **8/8 passed**. Every hero rendered at 356 × 199 CSS pixels with no horizontal overflow. The 40/60 comparison and 90/115 comparison were visually inspected in the rendered page.
- Hero-specific browser warning/error check: **passed**, with no console entries for the new Batch B paths.
- Pre-ship independent review: **passed after one documentation correction**. Provenance and render/metadata reviewers found no release blockers. The red-team reviewer correctly identified that the 60 HP freshwater source was incorporated in the electric-versus-gas composite; its asset ID, checksum, and use are now recorded above. Remaining comments about related pontoon imagery and the intentionally mixed lifestyle/product-cutout 40/60 comparison were judged non-blocking after rendered visual review.
- Production verification: **passed 2026-07-18**. Commit `b964b2864fc7db71893d15dcf94a40c3a7e81394` is an ancestor of the verified production build `617a97b7156f087ba2c664186ec8fd381a82f4f5`. Cache-busted raw checks returned HTTP 200 for all eight article pages and all eight WebP assets, and each page emitted the intended Batch B asset as its Open Graph image. The in-app production browser confirmed all eight heroes at 1440 × 1000 and 390 × 844: each image loaded, retained the 16:9 frame, had accurate alternative text, and introduced no horizontal overflow. The mobile hero frame was 356 × 199 CSS pixels on all eight pages. The two held service articles were rechecked against the repository and HBW's current Mercury image library; no authentic impeller or water-pump service photograph is available, so both remain intentionally unchanged. Final `growth:check` at `2026-07-19T01:41:51Z` returned `ok: true`, `hardFailures: []`, and `sitemapUrls: 366`.
