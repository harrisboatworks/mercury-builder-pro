

# Add 3 New Blog Posts with Hero Images (Published Today)

## Overview

Add three new long-form blog posts from the uploaded markdown file to `src/data/blogArticles.ts`, all published immediately with today's date (2026-02-06). Each post comes with its final hero image -- no placeholders needed this time.

## The 3 New Articles

| # | Title | Slug | Category | Est. Read Time | Hero Image |
|---|-------|------|----------|---------------|------------|
| 1 | Inside Mercury's 2026 Outboard Lineup -- What Actually Matters for Ontario Boaters | `mercury-2026-outboard-lineup-ontario` | Buying Guide | 10 min | `Inside_Mercury_s_2026_Outboard_Lineup_Blog_Post_Hero_Image.png` |
| 2 | Mercury Avator & the Future of Electric Boating in Ontario | `mercury-avator-electric-boating-ontario` | Buying Guide | 10 min | `Mercury_Avator_and_The_Future_Blog_Post_Hero_Image.png` |
| 3 | 2026 Boating Season Preview: Rice Lake & Ontario Fishing Outlook | `2026-rice-lake-fishing-season-outlook` | Lifestyle | 10 min | `2026_Rice_Lake_Fishing_Season_Blog_Post_Hero_Image.png` |

## Content Cleanup (same approach as the last batch)

- Strip all footnote references (`[^1]`, `[^2]`, etc.)
- Remove "Harris Boat Works | Gores Landing" signature blocks at the bottom
- Replace `harrisboatworks.ca` references with internal links where appropriate (e.g., `/quote/motor-selection`, `/blog/mercury-prokicker-rice-lake-fishing-guide`)
- Convert section headers to H2/H3 hierarchy matching existing articles
- Preserve all bullet lists, data comparisons, and structured content
- Map cross-references to other blog posts (e.g., "Blog Post #4") to actual internal links

## Per-Article Details

### Article 1: Mercury's 2026 Outboard Lineup
- **Keywords**: mercury 2026 lineup, mercury outboard models, mercury fourstroke 2026, mercury verado v10, avator electric outboard, mercury outboard ontario
- **FAQs**: Best motor for Rice Lake fishing boats, V10 Verado relevance, Avator suitability for Ontario, how to choose from the lineup
- **Internal links**: Quote builder (`/quote/motor-selection`), ProKicker guide, motor families comparison

### Article 2: Mercury Avator & Electric Boating
- **Keywords**: mercury avator, electric outboard motor, avator electric boat, electric boating ontario, mercury electric motor, cottage boat electric
- **FAQs**: Avator range and runtime, gas vs electric for Rice Lake, Avator vs trolling motor, charging and maintenance
- **Internal links**: Quote builder, 2026 lineup article (cross-link)

### Article 3: 2026 Rice Lake Fishing Season Preview
- **Keywords**: rice lake fishing 2026, ontario fishing season, rice lake walleye, rice lake muskie, boating season preview, kawartha fishing
- **FAQs**: Best fish species to target, seasonal patterns, motor recommendations for fishing, rental options
- **Internal links**: Quote builder, ProKicker guide, repower guide, Avator article (cross-link)

## Steps

1. **Copy 3 hero images** into `public/lovable-uploads/`
2. **Add 3 new article entries** to the `blogArticles` array in `src/data/blogArticles.ts`, inserted after the last batch of articles (before the closing `];`)
3. Each entry gets `publishDate: '2026-02-06'` so they appear immediately
4. All FAQs and keywords included for SEO schema generation

## Files Changed

- **`src/data/blogArticles.ts`** -- 3 new article objects added to the array
- **3 new image files** copied to `public/lovable-uploads/`

No other files need changes -- blog index, article pages, RSS feed, sitemap, and admin dashboard all pick up new articles automatically from the array.

