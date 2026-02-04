
# Standardize Domain Usage Across All Pages

## Problem Summary

Several files have hardcoded domain strings instead of using the centralized `SITE_URL` constant from `src/lib/site.ts`. This creates:
- Inconsistent URLs when sharing blog articles
- SEO schema data pointing to wrong/inconsistent domains
- Potential issues with custom domain changes in the future

---

## Files Requiring Updates

### 1. BlogArticle.tsx
**Issue:** Line 219 uses `harrisboatworks.ca` (wrong domain entirely)

```typescript
// Before
const articleUrl = `https://harrisboatworks.ca/blog/${article.slug}`;

// After
import { SITE_URL } from '@/lib/site';
const articleUrl = `${SITE_URL}/blog/${article.slug}`;
```

---

### 2. BlogSEO.tsx
**Issue:** Multiple hardcoded `quote.harrisboatworks.ca` strings for schema data

Import `SITE_URL` and replace all hardcoded URLs:
- Line 9: URL construction
- Lines 25, 27, 29, 34, 70, 76: Schema URLs
- Lines 98, 127, 139: Image URLs

---

### 3. GlobalSEO.tsx
**Issue:** All schema URLs are hardcoded

While currently correct (`quote.harrisboatworks.ca`), for maintainability, centralize by importing `SITE_URL`:
- Lines 9, 10, 11, 14, 29, 34: Organization schema
- Lines 63, 65, 82: LocalBusiness schema
- Lines 137, 138, 146, 147, 152: WebSite and FAQ schemas

---

### 4. Edge Function: send-saved-quote-email
**Issue:** Line 38 falls back to old domain

```typescript
// Before
const siteUrl = Deno.env.get("SITE_URL") || "https://hbwsales.ca";

// After
const siteUrl = Deno.env.get("SITE_URL") || "https://quote.harrisboatworks.ca";
```

---

## Implementation Approach

| File | Change |
|------|--------|
| `src/pages/BlogArticle.tsx` | Import `SITE_URL`, use for `articleUrl` |
| `src/components/seo/BlogSEO.tsx` | Import `SITE_URL`, replace all hardcoded URLs |
| `src/components/seo/GlobalSEO.tsx` | Import `SITE_URL`, replace all hardcoded URLs |
| `supabase/functions/send-saved-quote-email/index.ts` | Fix fallback domain |

---

## Benefits

- **Single source of truth**: All URLs derive from `SITE_URL`
- **Domain change resilience**: Future domain changes only need one file update
- **Correct social sharing**: Blog share buttons will use correct production URL
- **SEO consistency**: All structured data points to the same canonical domain
