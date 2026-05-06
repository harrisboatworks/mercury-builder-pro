# Tier 1 Blog Insertion + EDT Date Fix

## Findings from current codebase

- `src/data/blogArticles.ts` already has scheduled-publish gating via `publishDate` + `isArticlePublished` (line 25). Future-dated entries are already hidden until their date arrives — no rollout work needed.
- `BlogArticle` body content is rendered via `MarkdownSectionCards`, which already uses `remark-gfm` (line 81 of that component). **Markdown pipe tables already render.** No table-renderer change needed. The legacy line-by-line `renderContent` in `BlogArticle.tsx` is no longer the path used for body content.
- The relevant date bug is real: `new Date("2026-05-07")` is parsed as UTC midnight = May 6 8 PM EDT, so `isArticlePublished` flips a day early.
- Blog article shape uses fields: `slug, title, description, content, image, author, datePublished, dateModified, publishDate, category, readTime, faqs, keywords` (no `internalLinks`, no `heroImageAlt`, no `primaryKeyword/secondaryKeywords`, no `lastModifiedDate`). I will map the user's spec to actual fields.

## Field mapping (spec → real schema)

| Spec field | Real field |
|---|---|
| `heroImage` | `image` |
| `metaDescription` | `description` |
| `publishedDate` | `datePublished` + `publishDate` |
| `lastModifiedDate` | `dateModified` |
| `primaryKeyword` + `secondaryKeywords` | merged into `keywords[]` |
| `heroImageAlt`, `internalLinks` | not supported by schema — dropped, will be reported |

## Plan

### 1. EDT date helper

Add to `src/data/blogArticles.ts` (just above `isArticlePublished`):

```ts
export function parseLocalDate(dateString: string): Date {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}
```

Update `isArticlePublished` to use `parseLocalDate(publishDate)` instead of `new Date(publishDate)`.

### 2. BlogCard date display

In `src/components/blog/BlogCard.tsx` (line 50), replace `new Date(article.datePublished)` with `parseLocalDate(article.datePublished)` and import the helper.

Also update the date display at the top of `src/pages/BlogArticle.tsx` (around line 348) to use `parseLocalDate`.

### 3. Skip table renderer change

Tables already render via `remark-gfm` in `MarkdownSectionCards`. No-op.

### 4. Insert 4 new article entries

Append to `blogArticles` array (after the most recent entry):

1. `used-outboard-buying-guide-ontario` — datePublished/publishDate `2026-05-07`, dateModified `2026-05-07`, category `'Buying Guide'`, image `/lovable-uploads/hero-used-outboard-buying-guide.png`
2. `trent-severn-waterway-boating-guide-2026` — `2026-05-08`, category matched to `2026-rice-lake-fishing-season-outlook`, image `/lovable-uploads/hero-trent-severn-waterway-2026.png`
3. `outboard-overheating-emergency-guide` — `2026-05-09`, category matched to `mercury-outboard-wont-start-troubleshooting`, image `/lovable-uploads/hero-outboard-overheating.png`
4. `rice-lake-boating-guide-2026` — `2026-05-10`, category matched to #2, image `/lovable-uploads/hero-rice-lake-boating-guide.png`

For each:
- `description` = frontmatter `meta_description`, kept ≤160 chars (truncate cleanly if needed — the prerender build fails >160).
- `content` = full markdown body from line ~21 onward, **excluding** the `[CUSTOMER STORY OPPORTUNITY ...]` line (replaced with a `// TODO: Add customer story for <slug>` comment placed adjacent to the entry).
- `faqs` = the `## Frequently Asked Questions` Q&A pairs.
- `keywords` = `[primary_keyword, ...secondary_keywords]` from frontmatter.
- `readTime` computed from word count (≈200 wpm), e.g. `'7 min read'`.
- `author` = `'Harris Boat Works'`.
- For Post 4, add a contextual link to `/blog/pleasure-craft-licence-update-repower-ontario` in the Practical Notes section where PCL is mentioned.

### 5. Description length guard

The build prerender enforces ≤160 chars on description / og:description / twitter:description (we hit this twice already). Each new article's `description` will be checked and trimmed before insertion.

### 6. Sitemap

`public/sitemap.xml` — add 4 `<url>` entries with `<lastmod>` = `publishDate`. (Sitemap is committed static XML in this repo.)

### 7. Verification

- Build passes (description ≤160 chars on all 4 new posts).
- 4 new entries present, no `[CUSTOMER STORY OPPORTUNITY]` strings in `blogArticles.ts`.
- Future-dated posts hidden from `/blog` until their EDT date.
- Sitemap includes all 4.

### Report after build

- Article count before/after (+4)
- Build status
- Confirm dates gate correctly in EDT
- Note dropped fields (`heroImageAlt`, `internalLinks`, `primaryKeyword`/`secondaryKeywords` as separate fields) and how they were folded in
