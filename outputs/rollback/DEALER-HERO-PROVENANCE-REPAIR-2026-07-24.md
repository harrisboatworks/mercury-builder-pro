# Dealer-area hero provenance repair

Date: 2026-07-24

Branch: `codex/dealer-hero-provenance-20260724`

Baseline: `fd3fabe50b426c27018017861569c2e67db2e505`

## Scope

This repair changes only the hero mapping, alternative text, modified date, generated Markdown date, and sitemap image metadata for three Mercury dealer-area articles. Titles, slugs, descriptions, copy, routes, and ranking-experiment surfaces are unchanged.

| Article slug | Retired hero | Provenance-documented hero |
| --- | --- | --- |
| `mercury-dealer-markham-ontario-hbw` | `/lovable-uploads/hero-mercury-90-shop-shot.png` | `/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` |
| `mercury-dealer-richmond-hill-ontario-hbw` | `/lovable-uploads/hero-gta-richmond-hill-pickup-motor.png` | `/lovable-uploads/blog-heroes-2026-07/hero-mercury-75-90-115-official-freshwater-2026-07.webp` |
| `mercury-dealer-northumberland-county-hbw` | `/lovable-uploads/hero-mercury-90-shop-shot.png` | `/lovable-uploads/blog-heroes-2026-07/hero-mercury-spring-run-up-hbw-service-2026-07.webp` |

The Richmond Hill image was removed because it visibly named a nonexistent competing dealership, “RICE LAKE MARINE — RURAL DEALERSHIP.” The Markham and Northumberland images were replaced because their generated-motor provenance was not documented.

## Provenance

All three replacement files were already tracked and documented in `BLOG-IMAGE-BATCH-A-ROLLBACK-2026-07-18.md`.

- Markham uses a crop-only composite of the real HBW marina aerial.
- Richmond Hill uses authenticated Mercury Marine dealer-portal freshwater photographs of exact 75, 90, and 115 HP motors. No motor, cowl, logo, person, boat, or water was generated or redrawn.
- Northumberland uses a crop-only composite of a real HBW installation/service photograph.

| Hero | Bytes | SHA-256 |
| --- | ---: | --- |
| `hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` | 310818 | `d767174127a84c62cad3222837d25b4040f9567739ad0c8bf00fa037034be190` |
| `hero-mercury-75-90-115-official-freshwater-2026-07.webp` | 266476 | `56b12c3ab01a77d5dac92f75eb3713b11a47f88bc52767406c90d421a6c565e9` |
| `hero-mercury-spring-run-up-hbw-service-2026-07.webp` | 145490 | `0d2e9fd78d3c38d4d6f2cc4152947d1a54c5d5fd242cbcb89b2d81293fd2c376` |

## Rollback

Revert this repair commit. Do not delete any of the replacement files: they predate this branch and are used by other articles.
