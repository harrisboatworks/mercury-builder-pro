

# Add 4 New Blog Posts (Published Today)

## Overview

Add the four long-form blog posts from the uploaded markdown file to `src/data/blogArticles.ts`, all published immediately with today's date (2026-02-06). Images will use existing thematically-appropriate placeholders for now (the BlogCard fallback will protect against any issues). You said you'll provide the real hero images afterward.

## The 4 New Articles

| # | Title | Slug | Category | Est. Read Time |
|---|-------|------|----------|---------------|
| 4 | What the 2026 Boating Market Means for Ontario Boat Buyers | `2026-boating-market-ontario-boat-buyers` | Market Insight | 10 min |
| 5 | Tariffs, Trade, and Canadian Boating -- What Harris Boat Works Customers Should Know in 2026 | `tariffs-trade-canadian-boating-2026` | Market Insight | 12 min |
| 6 | Why Boat Rentals and Shared Access Are Booming in 2026 -- And How Harris Boat Works Gets You on the Water | `boat-rentals-shared-access-booming-2026` | Lifestyle | 10 min |
| 7 | Why Mercury Dominates the Outboard Market -- And Why Harris Boat Works Chose Them | `why-mercury-dominates-outboard-market` | Buying Guide | 12 min |

## Temporary Placeholder Images

These are existing images that thematically match each post. They'll be swapped for the real hero images once you provide them:

| Article | Placeholder Image |
|---------|-------------------|
| 2026 Boating Market | `2026_Mercury_Buying_Pricing_Promotions_Hero.png` |
| Tariffs & Trade | `Financing_A_New_Boat_Motor_Hero.png` |
| Boat Rentals | `Boaters_Trust_HBW.png` |
| Mercury Dominates | `Comparing_Motor_Families.png` |

## Content Cleanup

Each article will be cleaned up from the raw markdown:

- Strip all footnote references (e.g. `[^1]`, `[^2]`) since the blog renderer doesn't support them
- Remove the "Harris Boat Works | Gores Landing" signature blocks at the bottom (already handled by site footer)
- Replace `harrisboatworks.ca` references with internal links where appropriate (e.g. `/quote/motor-selection`, `/blog/...`)
- Convert section headers to match existing article style (H2/H3 hierarchy)
- Preserve all data tables, bullet lists, and structured content

## Per-Article Details

### Article 4: 2026 Boating Market
- **Keywords**: 2026 boating market, ontario boat buying, boat market forecast, luxury tax boats canada, boat dealer inventory, used boat market
- **FAQs**: Market stabilization outlook, luxury tax repeal impact, best time to buy in 2026, pre-owned vs new boat value
- Internal links to quote builder and repower guide

### Article 5: Tariffs, Trade, and Canadian Boating
- **Keywords**: tariffs boating canada, CUSMA boating, mercury outboard tariff, canada us trade boats, boat prices tariffs 2026
- **FAQs**: CUSMA review impact, Mercury pricing changes, Canadian-built vs US boats, practical buying timing
- Internal links to quote builder

### Article 6: Boat Rentals and Shared Access
- **Keywords**: boat rental rice lake, boat rental market 2026, boat club vs ownership, rice lake boat rental, harris boat works rentals
- **FAQs**: Rental vs ownership cost, what's included in rental, rental-to-ownership path, Rice Lake fishing species
- Internal links to rentals and quote builder

### Article 7: Why Mercury Dominates
- **Keywords**: mercury marine market share, best outboard brand, mercury vs yamaha, mercury verado v12, mercury innovation, mercury prokicker
- **FAQs**: Mercury vs competitors, Verado V12 features, SmartCraft benefits, why dealers choose Mercury
- Internal links to ProKicker article, motor families comparison, quote builder

## Technical Details

### File Changed
- **`src/data/blogArticles.ts`** -- Add 4 new article entries to the `blogArticles` array, placed right after the ProKicker article (the most recent published article). All 4 will have `publishDate: '2026-02-06'` so they appear immediately.

### No Other Files Need Changes
- BlogCard already has the fallback image handler
- BlogArticle page renders markdown content the same way for all articles
- RSS feed, sitemap, and admin dashboard automatically pick up new articles from the array

