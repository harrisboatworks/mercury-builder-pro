# Dealer-page trust batch

Date: 2026-07-24

Branch: `codex/dealer-trust-batch-20260724`

Baseline: `c913cab8ad4378c0cafe14fe52f559c7a395d25e`

## Scope

This repair removes four unproven or misleading generated dealer-page heroes and corrects the uncaveated Verado and SeaPro availability wording on the Whitby and Oshawa pages. Titles, slugs, descriptions, routes, canonicals, and ranking-experiment surfaces are unchanged.

| Article slug | Retired hero | Provenance-documented hero |
| --- | --- | --- |
| `mercury-dealer-mississauga-ontario-hbw` | `/lovable-uploads/hero-gta-mississauga-service-counter.png` | `/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` |
| `mercury-dealer-vaughan-ontario-hbw` | `/lovable-uploads/hero-gta-vaughan-tech-install.png` | `/lovable-uploads/blog-heroes-2026-07/batch-d/hero-mercury-vaughan-hbw-service-real-2026-07.webp` |
| `mercury-dealer-whitby-ontario-hbw` | `/lovable-uploads/hero-mercury-dealer-whitby.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-mercury-pontoon-90ct-freshwater-2026-07.webp` |
| `mercury-dealer-oshawa-ontario-hbw` | `/lovable-uploads/hero-mercury-dealer-oshawa.png` | `/lovable-uploads/blog-heroes-2026-07/batch-b/hero-best-pontoon-outboard-115-freshwater-2026-07.webp` |

## Image decision and provenance

Built-in GPT Image 2 was used first to test a single-frame horizontal outpaint of the real Vaughan service photograph. The result was rejected because comparison with the source showed small reinterpretations in exposed engine and lower-unit details. The production asset is therefore a deterministic crop and resize of the real HBW photograph; no generated equipment pixels are used.

The other replacement files were already tracked and documented in the July 18 image-batch rollback records:

- Mississauga uses a single real HBW marina aerial.
- Vaughan uses one pixel-faithful crop of `src/assets/repower-hbw-shop-install.jpg`.
- Whitby uses authenticated Mercury Marine dealer-portal freshwater photography.
- Oshawa uses authenticated Mercury Marine dealer-portal freshwater photography.

| Hero | SHA-256 |
| --- | --- |
| `hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` | `d767174127a84c62cad3222837d25b4040f9567739ad0c8bf00fa037034be190` |
| `batch-d/hero-mercury-vaughan-hbw-service-real-2026-07.webp` | `238fabbfb0aefe9967fab8a05208b3c699cc477934fb205df5165090dcb18a7a` |
| `batch-b/hero-best-mercury-pontoon-90ct-freshwater-2026-07.webp` | `ff6eee156511984684acf5503b6156eaeeaecfc23c059b7e4a2007b38ade720a` |
| `batch-b/hero-best-pontoon-outboard-115-freshwater-2026-07.webp` | `0a1671de002e5df738fee384ce3900b44ab81029baa28205a1f029fac54ef501` |

## Product framing

Whitby and Oshawa now match the already-correct Mississauga and Vaughan wording:

- FourStroke and Pro XS are the standard repower lineup.
- Verado is available by special order.
- SeaPro is a commercial-duty option brought in to order.

## Rollback

Revert this batch commit. The three new Vaughan WebP files in `batch-d` are branch-local and may be deleted after confirming no later article references them. Do not delete the other replacement files; they predate this branch and are used by other articles.
