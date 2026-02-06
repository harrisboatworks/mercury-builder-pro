
# Mercury Outboards FAQ Page

## Overview

A dedicated, comprehensive FAQ page at `/faq` that aggregates the best questions and answers from across the entire site -- blog articles, repower page, about page, AI knowledge base, and the uploaded Mercury FAQ reference. The page will be organized by topic category, optimized for both human buyers and AI search engines with rich schema.org markup, and styled consistently with the existing site design.

## Content Strategy

The FAQ page will be organized into **8 topic categories**, curating the strongest questions from existing site content and supplementing with new questions from the uploaded Mercury reference file. Each category targets a distinct buyer intent:

1. **Choosing the Right Motor** -- HP sizing, motor families, boat matching
2. **Repowering Your Boat** -- signs, costs, process, timeline
3. **Maintenance and Service** -- seasonal care, service schedules, DIY vs pro
4. **New Motor Ownership** -- break-in, first oil change, warranty registration
5. **Warranty and Protection** -- coverage, extended options, what's covered
6. **Fuel, Operation and Safety** -- fuel types, ethanol, flushing, storage
7. **Financing and Pricing** -- payment options, deposit info, quote builder
8. **About Harris Boat Works** -- location, credentials, service area, hours

Each category will contain 4-8 curated questions. Total target: approximately 45-55 high-quality Q&A pairs. Every answer will be written from Harris Boat Works' perspective (first-person dealer voice), referencing Rice Lake, the Kawarthas, and local expertise where appropriate.

Content will adhere to company knowledge rules:
- Founded 1947, Mercury dealer since 1965, 79 years in business
- Use "lake test" not "sea trial"
- No fabricated stats or specific booking percentages
- Pricing from existing published content only

## New Files

### 1. `src/data/faqData.ts`
Central FAQ data file containing all questions organized by category. Each category has:
- `id` (slug for anchor links)
- `title` (display name)
- `icon` (Lucide icon name)
- `description` (one-line summary)
- `items[]` array of `{ question, answer }` pairs

This separates data from presentation and allows reuse by the SEO component, the page, and potentially the AI chatbot knowledge base.

### 2. `src/pages/FAQ.tsx`
The main FAQ page featuring:
- `LuxuryHeader` and `SiteFooter` (matching all other pages)
- Hero section with page title and description
- Category navigation bar (horizontal scroll on mobile, grid on desktop) with icon chips that smooth-scroll to sections
- Category sections, each with its own heading, description, and accordion group
- Internal cross-links to related pages (quote builder, repower, blog articles, finance calculator)
- CTA section at the bottom (matching the pattern from Blog.tsx and About.tsx)
- Breadcrumb navigation

### 3. `src/components/seo/FAQPageSEO.tsx`
SEO component with:
- `FAQPage` schema.org markup containing ALL questions (this is the primary AI search optimization -- a single page with comprehensive FAQ schema)
- `BreadcrumbList` schema
- `WebPage` schema with speakable specification (matching the blog's AI search optimization strategy)
- Canonical URL using `SITE_URL`
- Open Graph and Twitter meta tags
- Keywords targeting Mercury FAQ search intent

## Modified Files

### 4. `src/App.tsx`
- Add lazy import for the new FAQ page
- Add route: `<Route path="/faq" element={<FAQ />} />`

### 5. `src/components/ui/site-footer.tsx`
- Add "FAQ" link to the `navigationLinks` array (between "Blog" and "About")

### 6. `src/components/ui/hamburger-menu.tsx`
- Add "FAQ" link to the mobile navigation menu

## Technical Details

### Page Layout Structure

```text
+------------------------------------------+
|  LuxuryHeader                            |
+------------------------------------------+
|  Breadcrumb: Home > FAQ                  |
+------------------------------------------+
|  Hero: "Mercury Outboard FAQ"            |
|  Subtitle + search-friendly description  |
+------------------------------------------+
|  Category Nav Bar (scrollable chips)     |
|  [Motor] [Repower] [Maintenance] ...     |
+------------------------------------------+
|  Section: Choosing the Right Motor       |
|  +------------------------------------+  |
|  | Accordion Q&A items                |  |
|  +------------------------------------+  |
|                                          |
|  Section: Repowering Your Boat           |
|  +------------------------------------+  |
|  | Accordion Q&A items                |  |
|  +------------------------------------+  |
|  ...                                     |
+------------------------------------------+
|  CTA: "Ready to Find Your Motor?"        |
|  [Browse Motors] [Contact Us]            |
+------------------------------------------+
|  SiteFooter                              |
+------------------------------------------+
```

### SEO and AI Search Optimization

- **FAQPage schema** with every Q&A pair -- this is the single most impactful structured data for AI search engines (Google, Perplexity, ChatGPT search)
- **Speakable schema** on the page title and first description paragraph for voice assistant compatibility
- **Anchor links** for each category section (e.g., `/faq#repowering`) enabling direct deep links
- **Semantic HTML5** landmarks: `<main>`, `<section>`, `<nav>`, proper heading hierarchy (h1 > h2 > h3)
- **Keyword-rich** meta description targeting "Mercury outboard FAQ", "Mercury motor questions", "boat motor FAQ Ontario"
- **Internal linking** within answers to relevant pages (/quote, /repower, /blog/*, /finance-calculator)

### Accordion Pattern

Will use the existing `@radix-ui/react-accordion` components (already used on Repower, About, and Blog pages) with the same styling conventions:
- `type="single"` with `collapsible` for one-at-a-time expand
- Rounded border cards with hover state
- Open state background tint (`data-[state=open]:bg-stone-50`)

### Category Navigation

A sticky-ish horizontal chip bar (like a filter bar) that uses `scrollIntoView({ behavior: 'smooth' })` when clicked. Each chip shows the category icon and name. Active state highlights the current section using an Intersection Observer for scroll-spy behavior.
