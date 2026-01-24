
# Comprehensive SEO & Sitemap Improvements

## Overview

This plan addresses missing meta tags, stale sitemap, and adds new deposit/payment FAQs to the schema. It also introduces a dynamic sitemap generator that automatically includes blog articles.

---

## File Changes Summary

| File | Change |
|------|--------|
| `index.html` | Add favicon link, canonical URL, og:url, twitter:url |
| `src/components/seo/GlobalSEO.tsx` | Add 3 new FAQ items about deposits/payments |
| `src/utils/generateSitemap.ts` | NEW: Dynamic sitemap generator |
| `scripts/generate-sitemap.ts` | NEW: Build-time sitemap script |
| `vite.config.ts` | Add sitemap generation hook |
| `public/sitemap.xml` | Will be auto-generated with current dates + blog URLs |

---

## 1. Fix `index.html` Meta Tags

### Add Missing Tags

```html
<!-- After line 18 (apple-touch-icon) -->
<link rel="icon" href="/favicon.ico" type="image/x-icon" />

<!-- Before og:title (line 40) -->
<link rel="canonical" href="https://quote.harrisboatworks.ca/" />

<!-- After og:image (line 43) -->
<meta property="og:url" content="https://quote.harrisboatworks.ca/" />

<!-- After twitter:image (line 47) -->
<meta name="twitter:url" content="https://quote.harrisboatworks.ca/" />
```

### Result
- Favicon displays in browser tabs
- Search engines understand canonical URL
- Social shares link back to correct URL

---

## 2. Update `GlobalSEO.tsx` Schema FAQs

### Add 3 New FAQ Entries (after existing FAQs)

```typescript
{
  "@type": "Question",
  "name": "How do I reserve a Mercury motor?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "You can reserve any Mercury motor with a refundable deposit through our online quote builder. Deposit amounts are based on horsepower: $200 for motors 0-25HP, $500 for 30-115HP, and $1,000 for 150HP and up. The deposit locks in your price and holds the motor until pickup."
  }
},
{
  "@type": "Question",
  "name": "What payment methods do you accept for deposits?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "Our checkout supports Apple Pay, Google Pay, Link (Stripe one-click), and all major credit cards. Mobile payment options make it quick and easy to secure your motor from your phone."
  }
},
{
  "@type": "Question",
  "name": "Are motor deposits refundable?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "Yes, all deposits are fully refundable if you change your mind. There are no restocking fees or penalties. The deposit simply holds the motor and locks in your quoted price until you pick it up in person at our Gores Landing location."
  }
}
```

---

## 3. Create Dynamic Sitemap Generator

### New File: `src/utils/generateSitemap.ts`

```typescript
import { blogArticles, isArticlePublished } from '../data/blogArticles';

const BASE_URL = 'https://quote.harrisboatworks.ca';

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Static pages with their metadata
const staticPages: SitemapEntry[] = [
  { loc: '/', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 1.0 },
  { loc: '/quote/motor-selection', lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: 0.9 },
  { loc: '/promotions', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
  { loc: '/repower', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.9 },
  { loc: '/financing-application', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
  { loc: '/finance-calculator', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.7 },
  { loc: '/contact', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.6 },
  { loc: '/about', lastmod: new Date().toISOString().split('T')[0], changefreq: 'monthly', priority: 0.8 },
  { loc: '/blog', lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: 0.8 },
];

export function generateSitemapXML(): string {
  const today = new Date().toISOString().split('T')[0];
  
  // Get published blog articles
  const publishedArticles = blogArticles.filter(isArticlePublished);
  
  // Convert blog articles to sitemap entries
  const blogEntries: SitemapEntry[] = publishedArticles.map(article => ({
    loc: `/blog/${article.slug}`,
    lastmod: article.dateModified || article.datePublished,
    changefreq: 'monthly' as const,
    priority: 0.7
  }));
  
  // Combine all entries
  const allEntries = [...staticPages, ...blogEntries];
  
  // Generate XML
  const urlEntries = allEntries.map(entry => `  <url>
    <loc>${BASE_URL}${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}
```

### New File: `scripts/generate-sitemap.ts`

```typescript
// Build-time script to generate sitemap.xml
import { writeFileSync } from 'fs';
import { generateSitemapXML } from '../src/utils/generateSitemap';

const sitemap = generateSitemapXML();
writeFileSync('public/sitemap.xml', sitemap);
console.log('Sitemap generated with', sitemap.match(/<url>/g)?.length || 0, 'URLs');
```

### Update `vite.config.ts`

Add a plugin hook to regenerate sitemap on build:

```typescript
// Add to plugins array
{
  name: 'generate-sitemap',
  buildStart() {
    // Import and run sitemap generation
    import('./src/utils/generateSitemap').then(({ generateSitemapXML }) => {
      const fs = require('fs');
      fs.writeFileSync('public/sitemap.xml', generateSitemapXML());
    });
  }
}
```

---

## 4. Updated Sitemap Output Example

After generation, sitemap.xml will include:

```text
- / (homepage)
- /quote/motor-selection
- /promotions
- /repower
- /financing-application
- /finance-calculator
- /contact
- /about
- /blog (index)
- /blog/how-to-choose-right-horsepower-boat
- /blog/mercury-motor-maintenance-seasonal-tips
- /blog/mercury-motor-families-fourstroke-vs-pro-xs-vs-verado
- /blog/boat-repowering-guide-when-to-replace-motor
- /blog/breaking-in-new-mercury-motor-guide
- ... (all other published articles)
```

Each entry uses the article's `dateModified` for accurate `lastmod` values.

---

## Technical Details

### Why Dynamic Sitemap?

- **Automatic blog inclusion**: No manual updates when articles are added
- **Accurate dates**: Uses actual `dateModified` from article data
- **Future-proofing**: Respects `publishDate` for scheduled articles (excludes unpublished)
- **Build-time generation**: No runtime overhead

### Schema FAQ Benefits

Adding deposit/payment FAQs to structured data:
- **AI Search Visibility**: ChatGPT, Perplexity, Google SGE can surface this info
- **Rich Results**: Google may show FAQ snippets in search results
- **Voice Search**: Answers formatted for voice assistant responses

### Files Created/Modified

```text
MODIFIED:
├── index.html                    (+4 meta/link tags)
├── src/components/seo/GlobalSEO.tsx  (+3 FAQ entries)
└── vite.config.ts                (+sitemap plugin)

NEW:
├── src/utils/generateSitemap.ts  (sitemap generator)
└── scripts/generate-sitemap.ts   (build script)

AUTO-GENERATED:
└── public/sitemap.xml            (now dynamic)
```

---

## Post-Implementation

1. **Verify favicon** — Check browser tab shows icon
2. **Test social sharing** — Use Facebook/Twitter debug tools
3. **Submit sitemap** — Resubmit to Google Search Console
4. **Test schema** — Use Google Rich Results Test for FAQ visibility
