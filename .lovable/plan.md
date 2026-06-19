# Blog content pipeline — diagnostic

## 1. Where does the body come from at runtime?

100% from the static TS file. `src/pages/BlogArticle.tsx:16,44` does:

```ts
import { getArticleBySlug, getRelatedArticles, parseLocalDate } from '@/data/blogArticles';
...
const article = slug ? getArticleBySlug(slug) : undefined;
```

There is no Supabase fetch in this component, no `useEffect` loader, no CMS call. `article.content` (markdown from the TS entry) is fed directly into ReactMarkdown. Same pattern for the localized pages (`FrenchBlogArticlePage`, `KoreanBlogArticlePage`, etc.) — each imports from its sibling `*BlogArticles.ts`.

## 2. Is there a DB table holding bodies?

No. Querying `information_schema.tables` for anything matching `%blog%|%article%|%post%` returns only `blog_subscriptions` (mailing-list signups — 8 columns, none of them content). There is no `blog_posts`, no `articles`, no `content` table. Nothing in Supabase overrides the TS file.

## 3. Is `src/data/blogArticles.ts` still the source of truth?

Yes. It is THE source of truth for English posts. Not legacy, not seed data. Every render path (`BlogArticle.tsx`, `Blog.tsx`, `RssFeed.tsx`, `generateSitemap.ts`, `BlogSEO.tsx`, related-post grids) imports from it directly.

## 4. Then why does www.mercuryrepower.ca/blog/fourstroke-vs-pro-xs show different content?

Deployment lag, not a different data source. Per project memory (`mem://infrastructure/hosting-and-deploy-model`):

- **mercuryrepower.ca is served by Vercel**, built from the GitHub repo `harrisboatworks/mercury-builder-pro`.
- **Lovable is the code editor only.** Edits made here land in the Lovable preview and the Lovable-published URL (`mercury-quote-tool.lovable.app`), and get pushed to GitHub by the Lovable↔GitHub sync. They do NOT appear on mercuryrepower.ca until Vercel rebuilds from the GitHub commit.

So the live page showing "$ / $$ / $$$", "Asked at our desk", and "359 lb / 115 Pro XS" is rendering an OLDER build of `blogArticles.ts` — the version that was in the repo at the time of the last successful Vercel deploy. The Lovable preview URL (`id-preview--…lovable.app/blog/fourstroke-vs-pro-xs`) should already show the new content from the recent refresh.

Quick way to confirm: compare these three URLs side-by-side:
- Lovable preview: `https://id-preview--bc5f0a45-f6d8-495a-8ac7-81047b4a4121.lovable.app/blog/fourstroke-vs-pro-xs` (newest)
- Lovable published: `https://mercury-quote-tool.lovable.app/blog/fourstroke-vs-pro-xs` (after clicking Publish in Lovable)
- Production: `https://www.mercuryrepower.ca/blog/fourstroke-vs-pro-xs` (newest only after Vercel rebuild from main)

If preview shows the new content but production doesn't, the gap is in the GitHub→Vercel pipeline (commit not on main, Vercel build failed, or Vercel project paused). Check the Vercel dashboard's Deployments tab for the `mercury-builder-pro` project.

## 4. Correct way to update an existing post

**Edit the TS file only.** Specifically the entry in `src/data/blogArticles.ts` keyed by `slug`. There is no DB row to update and no admin UI that writes content. Then ensure the change reaches production via the GitHub→Vercel pipeline:

1. Edit `src/data/blogArticles.ts` in Lovable (already done for `fourstroke-vs-pro-xs`).
2. Verify on the Lovable preview URL.
3. Confirm the commit pushed to `harrisboatworks/mercury-builder-pro` on the branch Vercel deploys from (typically `main`).
4. Watch the Vercel deployment finish. The change goes live when that build completes.

There is nothing to edit in Supabase for blog body content. The only blog-related DB activity is subscriber emails in `blog_subscriptions`.

## Bottom line

Architecture is single-source: TS file in repo → Vite build → static HTML/JS. The mismatch you're seeing is a stale Vercel build, not a CMS override. No code or data changes needed to "fix" the data layer — the recent TS edit is correct; it just needs to land in a Vercel deploy.