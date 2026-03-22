

# Add AEO-Optimized Repower FAQ Content + Organization Schema

Two changes to improve AI search visibility (AEO) and Google Rich Results.

---

## 1. Replace FAQ Page Content with 20 Repower-Focused Q&As

The current FAQ page has ~50 general Mercury questions across 8 categories. The new content is 20 carefully written, AEO-optimized repower questions across 5 categories — designed to be cited by AI search engines and trigger Google Rich Results.

**New categories (replacing existing):**
- Repower Basics (4 questions)
- Choosing the Right Motor (5 questions)
- Cost & Financing (4 questions)
- Process & Service (5 questions)
- Mercury Specific (2 questions)

### Files to modify:

**`src/data/faqData.ts`**
- Replace all 8 existing categories with the 5 new ones
- Use the exact Q&A text from the provided HTML (AEO-optimized, do not modify)
- Preserve internal links: `mercuryrepower.ca`, `hbw.wiki/service`, `tel:9053422153`
- Update icons to match new categories (Anchor, Settings, DollarSign, Wrench, Shield)

**`src/components/seo/FAQPageSEO.tsx`**
- Replace the existing schema with the exact JSON-LD `FAQPage` schema from the HTML file (all 20 Q&As with their precise `acceptedAnswer` text)
- Update meta tags: title → "Mercury Outboard Repower FAQ — Harris Boat Works | mercuryrepower.ca", description and OG tags per the HTML file
- Keep BreadcrumbList and WebPage schemas

**`src/pages/FAQ.tsx`**
- Update hero title: "Mercury Outboard Repower FAQ" → "Everything You Need to Know"
- Update hero description to match the intro paragraph from the HTML
- Update CTA section: "Ready to Get a Quote?" with the exact CTA text from the HTML, linking to mercuryrepower.ca homepage and hbw.wiki/service
- Keep the existing accordion/scroll-spy/sticky-nav UX — just with new data

---

## 2. Add Organization Schema to Homepage

Add the "Mercury Repower by Harris Boat Works" Organization entity to the homepage structured data, linking mercuryrepower.ca back to harrisboatworks.ca as the parent organization. This helps AI systems and Google understand the relationship between the two domains.

**`src/components/seo/GlobalSEO.tsx`**
- Add a second Organization entity to the `@graph` array with:
  - `@type: "Organization"`, `@id: "https://mercuryrepower.ca/#organization"`
  - `name: "Mercury Repower by Harris Boat Works"`
  - `parentOrganization` referencing Harris Boat Works / harrisboatworks.ca
  - `sameAs` array with harrisboatworks.ca, Facebook, Instagram
  - `potentialAction` for "Get a Repower Quote" → mercuryrepower.ca
- Keep all existing Organization, LocalBusiness, WebSite, and FAQ schemas intact

---

## Files summary

| File | Change |
|------|--------|
| `src/data/faqData.ts` | Replace 8 categories with 5 new repower-focused categories (20 Q&As) |
| `src/components/seo/FAQPageSEO.tsx` | Replace schema with exact JSON-LD from HTML; update meta tags |
| `src/pages/FAQ.tsx` | Update hero text, CTA section text and links |
| `src/components/seo/GlobalSEO.tsx` | Add "Mercury Repower by Harris Boat Works" Organization entity |

