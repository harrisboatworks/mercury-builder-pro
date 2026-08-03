# Blog hero P0/P1 replacement — rollback and provenance

Date: 2026-08-03

Branch: `codex/blog-hero-p0p1-20260803`

Baseline: `71bcb8c6beafcd68d570d802cded34697f8d3b94`

## Scope

This corrective batch implements the prioritized P0/P1 targets from
`blog-audit-2026-08-02-claude/HERO-REPLACEMENT-BRIEFS.md`:

| Article slug | Previous hero | New hero | Disposition |
| --- | --- | --- | --- |
| `mercury-dealer-brampton-ontario-hbw` | `/lovable-uploads/hero-gta-brampton-showroom.png` | `/lovable-uploads/blog-heroes-2026-08/p0p1/hero-brampton-hbw-rice-lake-marina-authentic-2026-08.jpg` | Full replacement; removes retired dealer-tier signage, Racing/450R imagery, and inaccurate small white Mercury models |
| `mercury-ordering-process` | `/lovable-uploads/Ordering_Your_Mercury_What_to_Expect_Hero.png` | `/lovable-uploads/blog-heroes-2026-08/p0p1/hero-mercury-ordering-hbw-crest-corrected-2026-08.jpg` | Deterministic recomposite of both fabricated crest instances |
| `portable-outboard-mercury-guide-2-20hp` | `/lovable-uploads/Mercury_Portable_Outboards.png` | `/lovable-uploads/blog-heroes-2026-08/p0p1/hero-mercury-portable-hbw-crest-corrected-2026-08.jpg` | Deterministic recomposite of the fabricated crest |
| `best-mercury-for-family-runabouts` | `/lovable-uploads/Best_Mercury_Outboard_for_Family_Runabouts_Hero.png` | `/lovable-uploads/blog-heroes-2026-08/p0p1/hero-family-runabout-mercury-115-real-2026-08.jpg` | Full replacement; removes the fabricated `260` badge and `Rive Lake` crest |

The P2 trade-in badge brief is deliberately excluded. No article body, pricing,
route, component, translated article, or unrelated hero is changed. The four
matching sitemap image URLs and last-modified dates are kept in sync.

## Source provenance

No image model was used. Every output is a deterministic crop, resize, format
conversion, or localized crest recomposite produced by
`scripts/generate-blog-hero-p0p1-2026-08.mjs`.

| Source | Use | SHA-256 |
| --- | --- | --- |
| `public/lovable-uploads/blog-heroes-2026-07/hero-why-harris-mercury-dealer-hbw-aerial-2026-07.webp` | Documented real HBW Rice Lake marina aerial for the Brampton service-area page | `d767174127a84c62cad3222837d25b4040f9567739ad0c8bf00fa037034be190` |
| `public/lovable-uploads/cuddy-115-hero-real.png` | Existing tracked real photograph of a runabout with a Mercury 115 FourStroke | `ac4264d4450c92d8e4c45e4d3355f58b05cb0ab2f3bc042268405ca10635b569` |
| `public/lovable-uploads/Ordering_Your_Mercury_What_to_Expect_Hero.png` | Original ordering photography retained outside the two badge panels | `759c660c830a3ebb0532f71e49b8cbd4ea0ad43d15c1b3183576cb8e098addc6` |
| `public/lovable-uploads/Mercury_Portable_Outboards.png` | Original portable-outboard photography retained outside the badge panel | `c59341f6d9ac379bd351d880bdc31dd4a233130ae4ea7fbed619fc6b4a0d4d6b` |
| `src/assets/harris-logo.png` | Canonical black HBW crest; reads `Rice Lake, ON` and `1947` | `2a71c3b904e29b03340dffee068b44dbdd08bbc3d273aa8ceebc0f51eb1a34a5` |
| `src/assets/harris-logo-white.png` | Canonical white HBW crest for the dark ordering panel | `aeafa740c453bd1773511a6d3a16338927065a5cd4663782c6cfae53f8823cbe` |

The official Mercury Canada FourStroke range was checked on 2026-08-03. The
current high-horsepower family lists 250 and 300 HP, not 260 HP:
https://www.mercurymarine.com/ca/en/engines/outboard/fourstroke/fourstroke-250-300hp

The Brampton replacement intentionally depicts HBW's actual Gores Landing
facility. It does not imply that HBW operates a physical Brampton showroom.

## Output contract

Each slug receives:

- a 1600 × 900 JPEG source for fallback and Vercel image optimization;
- 640, 1024, and 1600 pixel WebP variants for the repository's responsive
  `<picture>` contract;
- a separate 1200 × 630 JPEG for Open Graph, X/Twitter, and schema metadata.

All four 1600-pixel WebP masters are below the brief's 300 KB ceiling.

| Output master | Bytes | SHA-256 |
| --- | ---: | --- |
| `hero-brampton-hbw-rice-lake-marina-authentic-2026-08.webp` | 251676 | `5377fde6be08d9a8d040e74cabef073ddb75d7f45fb0e7a61d80c72a72e38cfc` |
| `hero-family-runabout-mercury-115-real-2026-08.webp` | 122834 | `a11fd6a558b32962fa5c70ac618f8eae3798252edf36c590a0c192ab1a26ccca` |
| `hero-mercury-ordering-hbw-crest-corrected-2026-08.webp` | 140106 | `df8a409bf3d7fd197d871c8e0054e455df12c93cfc19950414a6a05e0498bf7b` |
| `hero-mercury-portable-hbw-crest-corrected-2026-08.webp` | 99516 | `027c9f0a30788ca1c09b0d0d9a30048aef4138f228523d952c6297e426f6ef62` |

| Social image | Bytes | SHA-256 |
| --- | ---: | --- |
| `hero-brampton-hbw-rice-lake-marina-authentic-2026-08-social.jpg` | 163088 | `8e172fdc7afa90c636ca8798a1efae284ff5c3f47d3bd9fa8304f270dbf3a7cc` |
| `hero-family-runabout-mercury-115-real-2026-08-social.jpg` | 125140 | `86c9b707b31370fe3938f55a3a07abc3ecbae8e2d531aec33ea1c401917f97ef` |
| `hero-mercury-ordering-hbw-crest-corrected-2026-08-social.jpg` | 152465 | `ac2d04e676d1c32d914f3185d50318868f0355d8b3ef74fb5d168d90c2b510fa` |
| `hero-mercury-portable-hbw-crest-corrected-2026-08-social.jpg` | 120925 | `a968e1023004a0c45ad5874bdadee8449cda6bdd6d3156a4c107b875090000f1` |

## Rollback

Preferred rollback after merge: revert this batch's commit. Before merge,
discard the branch or restore the four `image`, `socialImage`, `imageAlt`, and
`dateModified` field groups; restore the four generated Markdown dates; remove
the four new manifest entries; restore the four sitemap records; and remove only
`public/lovable-uploads/blog-heroes-2026-08/p0p1/`.

Do not delete or overwrite the source photographs, and do not reset the primary
working repository.

## Verification record

- Cache-busted production checks at 1440 x 900 reconfirmed all four old hero
  defects before implementation; this batch does not rely on a carried queue
  item alone.
- The asset contract passed for four fallback JPEGs, twelve responsive WebPs,
  and four 1200 x 630 social JPEGs. Manifest count and width declarations match
  the generated files.
- `npx tsc -b --pretty false` passed.
- `npm run check:blog-articles` passed for 202 articles.
- `npx vitest run src/lib/responsiveImageVariants.test.ts --environment node`
  passed (one file, two tests).
- `npm run build:dev` passed with 4,227 transformed modules.
- Static output for all four target routes contains the new absolute Open Graph
  and X/Twitter social-image URL, fallback JPEG, 640/1024/1600 WebP sources,
  and replacement alt text. The repository-wide static-prerender command
  generated all 405 routes, then reported unrelated missing generated surfaces
  because this corrective worktree is intentionally sparse.
- The four sitemap records carry the matching 2026-08-03 last-modified date and
  new fallback JPEG. No legacy defective filename remains referenced outside
  the variant manifest, documented source inputs, and this provenance record.
- Browser acceptance passed at desktop and mobile widths for all four routes.
  The Brampton hero rendered at 878 x 493 in a 1440-pixel viewport and 356 x
  199 in a 390-pixel viewport, with no horizontal overflow. Screenshots are in
  `local-hero-acceptance/` under the Codex visualization artifact directory for
  this run.
