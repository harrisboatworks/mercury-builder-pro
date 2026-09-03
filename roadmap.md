# Roadmap

## Blog Content Audit work order (2026-09-03) — GO received 2026-09-03 20:49 UTC

Jay's answers: ship 1A, 1B, 1C, 2 as FOUR SEPARATE COMMITS, report each, do NOT stop between
phases. Regenerate markdown twins + blog-index.json after each content phase.

- [x] Phase 0: inspect how posts, SEO fields, blog index, sitemap and redirects are stored/generated; report findings
- [x] Phase 1A: title tag + meta description rewrites (9 posts) — commit b4ddef04f
- [x] Phase 1B: consolidate duplicate posts (merges + 301 redirects) — done, HEAD 3d12bcea0
  Missing-slug rules from Jay:
  - Search archivedBlogArticles.ts, per-language files, public/blog/*.md by slug AND by content
    (grep "BigFoot"/"Big Foot", warranty "what you need to know", "won't start after sitting", "rental")
  - Found anywhere -> merge per table, 301 old slug to winner
  - Found nowhere -> add vercel.json 301 anyway, skip merge, flag in report
  - 'is-your-pontoon-eligible-for-mercury-command-thrust': loser = 'mercury-command-thrust-pontoon-eligibility-2026';
    merge its eligibility checklist into 'mercury-command-thrust-guide-pontoon-boats'; 301 BOTH slugs there
  - 'rice-lake-boat-rentals-from-toronto-gta' is a live 404 from internal links: if no rental article beyond
    'boat-rentals-shared-access-booming-2026', 301 dead slug to it + repoint internal links and clusters/seasonal
    config entries; if archived rental posts exist, keep strongest / fold in unique details / redirect rest
  - 'is-2026-good-year-to-buy-boat-ontario' not existing is fine; just 301 the '-canada' one
  - BigFoot vs Command Thrust lake-test story: if found, merge verbatim, first-person, own H2 into
    'mercury-command-thrust-complete-guide-2026'
  - Report exactly where each missing slug turned up (live / archive / twin / nowhere)
- [x] Phase 1C: retire 15 of 17 city dealer landing posts (301 to Toronto-to-Rice-Lake or Kawartha Repower) — done, HEAD fda3aaf48
- [x] Phase 2: five blog hub pages + index hub strip + per-post "More in [Hub]" blocks — commit 0fae67453
  Scripts-owned follow-up for Jay: add the 5 hub paths (/blog/diagnostics, /blog/reviews,
  /blog/repower, /blog/rice-lake, /blog/pricing) to staticSitemapEntries in
  scripts/static-prerender.mjs, or the post-build sitemap overwrite drops them in prod.
- [x] Final report: sent 2026-09-03 (hub assignment table lives in src/data/blogTopicHubs.ts HUB_ASSIGNMENTS)
- [ ] Phase 3: BLOCKED, needs real HBW pricing/service data from Jay. Do not draft:
  - Rebuild of /blog/boat-repowering-guide-when-to-replace-motor as flagship repower guide
  - "Mercury 90 HP: The All-In Cost in Ontario (2026)"
  - "Mercury Pro XS 175: The All-In Cost in Ontario (2026)"
  - Freshness pass on top-5 posts (needs 2026 photos + pricing)

## Carried over (Batch 3)

- [x] Edit 11: SKIPPED per Jay 2026-09-03. He is applying it on GitHub main (branch copy of
  'best-motor-small-lakes-ontario' is older). Do NOT edit that record here.
- [ ] Edit 14: STOPPED, awaiting Jay. SmartCraft record has 0 "As of May 2026"; the file's 2 hits
  are May-dated price-check claims in 'mercury-9-9-efi-review-ontario'. Need his call before relabelling.
- [ ] Task 15: pontoon HP sizing inline SVG. Plan delivered, awaiting approval to implement.
  Finding: only ONE tier is missing (300 to 400+ HP, 26+ ft luxury tritoon). The 200-250
  tritoon tier is already in the graphic. SVG also carries one em dash ("Worth it - 60 CT").
