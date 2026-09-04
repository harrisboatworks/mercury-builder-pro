# Roadmap

## Phase 4 (blog audit follow-up, work order 2026-09-03) — DONE 2026-09-04
- [x] 1. Prerender the five blog topic hub pages (03bbe15bf, e66a84d58, a083fb1b8 + regen b11e28cf9)
- [x] 2. Set `title` = `seoTitle` on 7 audited posts; regen twins + blog-index (eb1abf92b + regen a1be26c07, 6512760b1). No gate/test pinned the old titles.
- [x] 3. Un-stack credibility anchors on the two financing posts (a15fa68e1 + twin regen df11a4fe7)
- [x] Extra (required for green gates): multilingual sitemap lastmod now derives from article dateModified (d079d8f0a) — hreflang registry lock broke on any regen otherwise
- [x] Sync repairs for pre-existing type errors from the main port: 1261fadce (generateSitemap.ts), 111f540ba (2 test files)
- [x] Verification: all exit 0 — typecheck, vitest (836 passed/1 skipped), all 17 blog gates, price-hygiene, publishing-integrity
- [x] Final HEAD: 76c1bb5a7

## Phase 5 (internal link + redirect hygiene sweep) — DONE 2026-09-04
- [x] 1. Redirect map built from vercel.json (333 entries / 330 literal). Zero chains found; nothing to collapse.
- [x] 2. Link sweep of all src/ data files: zero live internal links point at a redirect source, a retired slug, or a dead slug. Only hits are in archivedBlogArticles.ts (not rendered) and two contract tests that intentionally assert redirect sources.
- [x] 3. Orphan report delivered: 17 live English posts with zero inbound links from other posts (all are hub-assigned). No links added.
- [x] 4. Twins + blog-index regenerated (e2d8bfc0a, date stamps only). All gates green.

## Parked (do not act without Jay)
- Edit 14 ("As of May 2026" relabelling) — awaiting Jay's call
- Phase 3 — blocked on real pricing data
