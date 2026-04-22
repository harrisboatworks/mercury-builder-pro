

## Sitemap status: already in place — minor expansion recommended

A dynamic sitemap is already generated, published, and discoverable. No setup needed. I'll only add a small expansion if you want broader entry-point coverage.

### What already exists

- **Build-time generator**: `vite.config.ts` → `sitemapPlugin` runs on every Vercel production build, calling `generateSitemapXML()` from `src/utils/generateSitemap.ts` and writing `public/sitemap.xml`.
- **Published**: live at `https://mercuryrepower.ca/sitemap.xml` (52 URLs today: 12 static pages + 40 blog articles, with image entries for blog posts).
- **Discoverable**: `public/robots.txt` ends with `Sitemap: https://mercuryrepower.ca/sitemap.xml`, and `vercel.json` has a passthrough rewrite for `/sitemap.xml`.
- **RSS feed** also generated at `/rss.xml` for blog content.
- **Quote funnel entry**: `/quote/motor-selection` is included with `priority: 0.9, changefreq: daily`.

The deeper quote funnel steps (`/quote/options`, `/quote/trade-in`, `/quote/summary`, etc.) are intentionally excluded — they are session-state pages that have no value (and no content) without an active quote in progress. Indexing them would hurt SEO, not help it.

### Optional expansion

A few public, indexable pages exist as routes but aren't currently in the sitemap. If you want them discoverable, I'd add these to the static list in `src/utils/generateSitemap.ts`:

| Path | Why add | Priority |
|---|---|---|
| `/accessories` | Public catalog page, real content | 0.7 |
| `/compare` | Motor comparison tool, useful entry | 0.7 |
| `/trade-in-value` | Standalone trade-in estimator, high search intent | 0.8 |
| `/financing` (already redirects to `/finance-calculator`, skip) | — | — |

Multilingual landing pages (`/fr`, `/zh`) — skip from the main sitemap; they belong in hreflang tags (already handled by `GlobalSEO.tsx`) and ideally a separate locale sitemap if traffic warrants it later.

### Change

Edit `src/utils/generateSitemap.ts` → `getStaticPages()` to add the three new entries. Vercel's next deploy regenerates `public/sitemap.xml` automatically. Then ping Google/Bing via Search Console / Webmaster Tools (manual step on your side — they'll also re-crawl on their own within days since the sitemap is referenced in `robots.txt`).

### What you don't need to do

- No new files, no new build step, no Vercel config change.
- No need to "publish" — the sitemap is already live.

### Confirm before I proceed

Want me to add the three optional entries (`/accessories`, `/compare`, `/trade-in-value`)? If yes I'll make the one-file change. If no, the sitemap is already doing its job and there's nothing to ship.

