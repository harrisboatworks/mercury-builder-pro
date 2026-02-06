

# New Blog Post: Mercury ProKicker for Rice Lake Fishing

## Overview

Add a new blog article about the Mercury ProKicker kicker motor, tailored for Rice Lake anglers. The content is based on the uploaded Perplexity research file, rewritten in the Harris Boat Works dealer voice with local Rice Lake context. This will be the first blog post specifically dedicated to the ProKicker lineup, which currently only gets brief mentions across existing articles.

## Title

**"The Secret Weapon Rice Lake Anglers Swear By: Mercury ProKicker Guide"**

This is hookier than the original research title -- it creates curiosity, speaks directly to the local audience, and implies insider knowledge.

## Content Strategy

The article will cover:
1. Why a dedicated kicker motor matters on Rice Lake (shallow, weedy, variable conditions)
2. What makes the ProKicker different from a standard small outboard
3. Choosing the right model (9.9 vs 15 vs 25 HP) with a comparison table
4. Tiller vs remote steering decision
5. Installation overview (DIY replacement vs professional new install)
6. Break-in reminders (linking to existing break-in article)
7. Why Harris Boat Works for the install (79 years, Platinum dealer, Rice Lake expertise)

Key adjustments from the uploaded content:
- Remove all Perplexity footnote references
- Update business age references (founded 1947, Mercury dealer since 1965, 79 years)
- Use "lake test" instead of "sea trial"
- Direct service inquiries to hbw.wiki/service per company policy
- Add internal links to the quote builder, maintenance blog post, break-in guide, and Rice Lake fishing article
- Add CTA pointing to the quote builder where ProKicker models are already available
- Image placeholder path set for the hero -- you'll supply this after

## Article Metadata

- **Slug**: `mercury-prokicker-rice-lake-fishing-guide`
- **Category**: Fishing
- **Read time**: ~10 min read
- **Publish date**: 2026-02-06 (today, immediately visible)
- **Keywords**: mercury prokicker, kicker motor rice lake, trolling motor ontario, prokicker installation, mercury 9.9 prokicker, kicker motor fishing boat, rice lake walleye trolling
- **HowTo schema**: Yes -- installation steps for HowTo rich results
- **FAQs**: 5 questions covering model selection, tiller vs remote, installation complexity, break-in, and compatibility

## File Changes

### 1. `src/data/blogArticles.ts`

Add a new `BlogArticle` object to the `blogArticles` array. It will be inserted near the top of the array (after the existing published articles, before the scheduled series) so it appears prominently on the blog index. The article includes:

- Full markdown content (~1200 words)
- A comparison table (9.9 vs 15 vs 25 HP) rendered in markdown
- `howToSteps` array for installation schema markup
- `faqs` array with 5 Q&A pairs
- Hero image path using a placeholder (`/lovable-uploads/ProKicker_Rice_Lake_Hero.png`) -- you'll replace this with your actual image

No other files need to change. The existing blog infrastructure (Blog.tsx, BlogArticle page, BlogCard, BlogSEO, RSS/sitemap generation) will automatically pick up the new article.

