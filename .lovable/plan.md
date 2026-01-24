

# Complete AI & Search Optimization Plan

## Current State Summary

Your site already has a strong foundation:
- **Google Analytics 4** is now active (G-0JNMHD89YJ)
- **robots.txt** explicitly allows all major AI crawlers (GPTBot, PerplexityBot, Claude, etc.)
- **Structured Data** includes Organization, LocalBusiness, FAQ, and Article schemas
- **Sitemap generator** is configured and runs on production builds
- **Blog SEO** includes HowTo, Speakable, and Article schemas

However, there are key gaps for AI agent optimization:

---

## What We'll Add

### 1. Create `llms.txt` File (AI Agent Directory)

Following the emerging [llmstxt.org](https://llmstxt.org) standard, this provides AI agents with a quick, structured overview of the site content.

**Location:** `public/llms.txt`

**Content includes:**
- Business identity and expertise
- Available services (Sales, Repower, Service, Parts)
- Mercury motor families with HP ranges
- Blog article index with descriptions
- Contact information and hours
- Key FAQs for common queries

This file makes it easy for ChatGPT, Claude, Perplexity, and other AI assistants to quickly understand what Harris Boat Works offers without crawling the entire site.

---

### 2. Create `public/.well-known/ai.txt` 

A standardized location for AI-specific metadata, including:
- Business description for AI context
- Preferred response guidelines (locale, currency, units)
- API endpoints if any are public
- Content update frequency

---

### 3. Add Semantic HTML Improvements

Enhance key pages with `<article>`, `<section>`, `<nav>` landmarks and ARIA labels to help AI agents parse content structure more accurately.

**Pages affected:**
- Motor selection page (product listings)
- Blog index and articles
- About page

---

### 4. Add Product Schema to Motor Listings

Currently individual motors don't have Product schema. Adding this enables:
- Rich snippets in Google Search
- Better AI understanding of inventory
- Price and availability in search results

**Implementation:**
- Add JSON-LD Product schema to motor cards
- Include price, availability, brand, and SKU data
- Reference the Organization as seller

---

### 5. Add RSS Feed for Blog

AI agents and news aggregators can subscribe to content updates.

**Location:** `public/feed.xml` (or served via `/rss`)

**Benefits:**
- AI agents discover new content automatically
- Google News eligibility (if applicable)
- Standard format for content syndication

---

### 6. Update Sitemap with Image Data

Enhance the sitemap to include `<image:image>` tags for:
- Motor product images
- Blog article featured images
- Logo and branding assets

This helps visual AI systems and Google Image Search.

---

### 7. Add Security.txt

Standard file for security researchers and automated tools.

**Location:** `public/.well-known/security.txt`

**Contents:**
- Contact email for security issues
- Preferred reporting method
- Policy acknowledgment

---

## File Changes Summary

| File | Action | Purpose |
|------|--------|---------|
| `public/llms.txt` | Create | AI agent content directory |
| `public/.well-known/ai.txt` | Create | AI metadata and guidelines |
| `public/.well-known/security.txt` | Create | Security contact info |
| `public/rss.xml` | Create | Blog RSS feed |
| `src/utils/generateSitemap.ts` | Update | Add image sitemap support |
| `src/components/motors/MotorCard.tsx` | Update | Add Product schema |
| `vite.config.ts` | Update | Generate RSS on build |

---

## Technical Details

### llms.txt Format

```text
# Harris Boat Works - Mercury Marine Dealer

> Family-owned Mercury dealer since 1965 serving Ontario boaters.
> Located on Rice Lake in Gores Landing, Ontario, Canada.

## About
Harris Boat Works is an authorized Mercury Marine dealer specializing in 
outboard motor sales, repowering, and service. CSI Award winner.

## Products
- Mercury FourStroke: 2.5-150HP, fuel-efficient
- Mercury Pro XS: 115-400HP, high-performance
- Mercury Verado: 175-600HP, premium supercharged
- Mercury SeaPro: Commercial-grade

## Services
- New motor sales with online quote builder
- Professional repower installation
- Factory-authorized Mercury service
- Genuine parts and accessories

## Blog Articles
- How to Choose the Right Horsepower for Your Boat
- Mercury Motor Maintenance: Seasonal Care Tips
- Understanding Mercury Motor Families
- Boat Repowering 101
- Breaking In Your New Mercury Motor

## Contact
- Phone: (905) 342-2153
- Email: info@harrisboatworks.ca
- Address: 5369 Harris Boat Works Rd, Gores Landing, ON K0K 2E0
- Hours: Mon-Fri 8am-5pm, Sat 9am-2pm

## Links
- Quote Builder: /quote/motor-selection
- Blog: /blog
- Financing: /financing-application
- Contact: /contact
```

### Product Schema Example

```json
{
  "@type": "Product",
  "name": "Mercury 115 Pro XS",
  "brand": { "@type": "Brand", "name": "Mercury Marine" },
  "category": "Outboard Motors",
  "offers": {
    "@type": "Offer",
    "price": "14999",
    "priceCurrency": "CAD",
    "availability": "https://schema.org/InStock",
    "seller": { "@id": "https://quote.harrisboatworks.ca/#organization" }
  }
}
```

---

## Priority Order

1. **High Impact:** llms.txt + ai.txt (immediate AI discoverability)
2. **Medium Impact:** Product schema on motors (rich search results)  
3. **Standard:** RSS feed, security.txt, image sitemap

---

## Post-Implementation

After publishing:
1. Submit updated sitemap to Google Search Console
2. Test llms.txt accessibility at `https://quote.harrisboatworks.ca/llms.txt`
3. Validate Product schema with Google Rich Results Test
4. Monitor Search Console for indexing and rich snippet activation

