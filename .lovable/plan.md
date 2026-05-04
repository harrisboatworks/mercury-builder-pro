## Goal

Two sequential passes:

1. **Pass A — Single file rewrite.** Replace the body of `public/blog/mercury-outboard-financing-ontario-2026.md` with the uploaded sample, while keeping the existing YAML front-matter and metadata header intact.
2. **Pass B — Cross-blog cleanup, audit only.** Per the uploaded prompt's hard rules, run the Pass 1 audit across all blog articles and report findings. **No code changes** for the four fix areas until you review and approve the audit.

---

## Pass A — Replace the financing article body

**File:** `public/blog/mercury-outboard-financing-ontario-2026.md`

The current file has a YAML front-matter block (lines 1-18) plus a small metadata header (Category / Published / Last updated / Read time / Canonical, lines 20-28) before the article body. The uploaded sample is body-only (no front-matter, no metadata header).

What I will do:

- **Preserve** the existing YAML front-matter (lines 1-18) exactly as-is, including `canonical`, `last_updated`, `keywords`, etc. (Per cleanup prompt rule: don't change SEO infrastructure or slugs.)
- **Preserve** the metadata header block (Category / Published / Last updated / Read time / Canonical).
- **Update** `last_updated` and `date_modified` in the front-matter to today's date (2026-05-04) since the body is being rewritten.
- **Replace** everything from the H1 (`# Mercury Outboard Financing...`) onward with the new body from the uploaded sample (lines 1-143 of the upload).
- The new body already includes its own H1, intro, Quick recommendation, What changes the answer, table of what's included, Standard vs promo rate, Approval criteria, Common scenarios, Cash vs financing, Related guides, CTAs, FAQ, and Jay Harris byline. No additional structural changes needed.

I will not touch any other blog file in this pass.

---

## Pass B — Cross-blog cleanup, Pass 1 audit (READ-ONLY)

The uploaded prompt is explicit: **"Pass 1: Audit only. Wait for Jay's approval before writing any code."** I will follow that rule strictly. After the financing rewrite ships, I will produce an audit report covering all four fix areas, then stop and wait for your go-ahead on each.

**Important scope finding from exploration:** The article corpus lives in `src/data/blogArticles.ts` (referenced explicitly in the prompt), not in `public/blog/*.md`. The `public/blog/` directory only contains 11 markdown files; the prompt references ~50 articles whose slugs (e.g., `boat-hull-replacement-vs-repower-decision`, `how-to-choose-right-horsepower-boat`, `mercury-75-vs-90-vs-115-comparison`) do not exist as .md files. The audit will treat `src/data/blogArticles.ts` as the source of truth and flag any cluster slugs that don't exist there so you can confirm scope before Pass 2+.

The audit will report:

- **Fix 1 (Internal link clusters):** For every article in `blogArticles.ts`, list its slug, which of the 5 clusters it belongs to (or "no clear cluster"), whether it already has a "Related guides" section, and which cluster-aligned links are missing. Flag any cluster slugs from the prompt that don't resolve to a real article.
- **Fix 2 (Trust language):** Every instance of "Mercury dealer since 1965", "since 1947", "for nearly 60 years", or related phrasing across `src/data/blogArticles.ts`, `public/blog/*.md`, `src/data/frenchBlogArticles.ts`, etc. — with file path, line number, current phrasing, and a proposed corrected phrasing per the standard in the prompt.
- **Fix 3 (Em dashes in titles):** Every article title containing `—` across all `*BlogArticles.ts` data files, with current title and a proposed replacement (colon, period, or restructure — whichever reads cleanest).
- **Fix 4 (Author byline):** Whether `src/data/blogArticles.ts` (and the Article JSON-LD generator in `src/components/seo/`) already exposes an author field, where the existing article body is rendered (`src/pages/BlogArticle.tsx`), and where the proposed `AuthorByline` component would mount (top meta + bottom-of-body).

Audit deliverable: a single markdown report posted in chat. No files written. After you review, you tell me which fixes to implement and in what order (the prompt suggests Fix 4 → 3 → 2 → 1).

---

## What I will NOT do in this turn

- Will not edit `src/data/blogArticles.ts` or any other blog file beyond `mercury-outboard-financing-ontario-2026.md`.
- Will not add the `AuthorByline` component, change titles, change trust language, or add internal link clusters until the audit is reviewed and approved.
- Will not change any slugs, canonical URLs, JSON-LD schemas, FAQ schema, or meta tags.
- Will not touch French / Korean / Mandarin / Spanish localized blog data files (the prompt is silent on whether the cleanup applies to translations — I'll flag this in the audit and ask).

---

## Files touched

**Pass A (write):**
- `public/blog/mercury-outboard-financing-ontario-2026.md` — replace body, preserve front-matter, bump `last_updated` and `date_modified` to 2026-05-04.

**Pass B (read only):**
- `src/data/blogArticles.ts`
- `public/blog/*.md` (all 11)
- `src/components/seo/*` (to check Article JSON-LD author field)
- `src/pages/BlogArticle.tsx` (to locate where AuthorByline would mount)
- Localized blog data files (flag-only, no analysis until you confirm scope)

---

## Open question to resolve in the audit phase, not now

Whether Fix 1-4 should also apply to `frenchBlogArticles.ts`, `koreanBlogArticles.ts`, `mandarinBlogArticles.ts`, `spanishBlogArticles.ts`. I'll flag this at the top of the audit report and wait for your call.
