

## Fix Google Search Console structured-data errors

Two critical issues flagged on the homepage (and pattern-matching across the entire site):

### Issue 1: Duplicate `FAQPage` schema

`GlobalSEO` renders on **every page** (App.tsx line 529) and emits a 9-question `FAQPage`. Then 13+ page-specific SEO components (`FAQPageSEO`, `RepowerPageSEO`, `AboutPageSEO`, `FinancingSEO`, `MotorSelectionSEO`, `FinanceCalculatorSEO`, `BlogSEO`, `PromotionsPageSEO`, French/Mandarin landings, etc.) ALSO emit their own `FAQPage`. Google sees two FAQPage entities per URL → "Duplicate field FAQPage" error.

Homepage `/` is currently the cleanest case (only GlobalSEO emits FAQPage there since HomepageSEO doesn't), but Google still detected duplicates — likely because the prerendered HTML and the React-helmet hydration both emit the schema, OR a second instance is being injected somewhere I'll trace.

### Issue 2: `Product` missing offers/review/aggregateRating

Inside `GlobalSEO` → `LocalBusiness.hasOfferCatalog`, four `Offer` entries wrap bare `Product` objects (FourStroke, Pro XS, Verado, Ethanol-Free Fuel) with **no `offers`, `review`, or `aggregateRating`**. Google's Product Snippets validator requires at least one of these three on every Product.

(Also: Verado is listed despite the policy that HBW does not sell Verado — should remove.)

### Fix plan

**File: `src/components/seo/GlobalSEO.tsx`**
1. **Remove the entire FAQPage block** (lines 290–359). Reason: every page that needs FAQ schema already has its own page-specific FAQPage. The global one duplicates whatever the page-specific component emits and pollutes pages that shouldn't have FAQ schema (quote builder, admin, etc.).
2. **Convert the 4 bare `Product` items in `hasOfferCatalog`** to plain `Service` entries OR add `category` + remove the `@type: Product` (use the Offer's own `name`/`description` only). Cleanest fix: change `"@type": "Product"` → `"@type": "Service"` for the catalog items (these are catalog references, not standalone product listings — a Service entry with name/description is valid and won't trigger Product Snippets validation).
3. **Remove the Verado entry** (line 144–151) per the Verado exclusion policy already in memory.

**No other files need changing** — page-specific FAQPage schemas (FAQPageSEO, RepowerPageSEO, etc.) remain as the single source of FAQ schema per route, which is correct.

### Why this works
- One FAQPage per URL (the page-specific one) → no duplicate field warning
- No bare Product entities anywhere → no Product Snippets warning
- Verado removed → memory compliance
- Page-level SEO files untouched → no risk of regression on pages already validated

### After deploy
Re-validate `https://mercuryrepower.ca/` in the Google Rich Results Test, then click "Validate Fix" in Search Console for both the FAQ and Product Snippets reports. Google will recrawl over 1–4 weeks.

