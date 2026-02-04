
# Update Domain to mercuryrepower.ca

## Overview

Transitioning the primary domain from `quote.harrisboatworks.ca` to `mercuryrepower.ca`. Thanks to the centralized `SITE_URL` constant, the frontend only needs one change. However, several static files and edge function fallbacks still have hardcoded domains.

---

## Changes Required

### 1. Core SITE_URL Constant (Single Source of Truth)

**File:** `src/lib/site.ts`

```typescript
// Before
'https://quote.harrisboatworks.ca'

// After
'https://mercuryrepower.ca'
```

This automatically updates:
- All SEO schema URLs (GlobalSEO, BlogSEO)
- Blog article share URLs
- QR codes on quote PDFs
- Canonical URLs in components

---

### 2. Static Public Files (Manual Updates)

| File | Changes |
|------|---------|
| `public/robots.txt` | Update sitemap URL and header comment |
| `public/sitemap.xml` | Update all `<loc>` URLs (8 entries) |
| `public/llms.txt` | Update Key Links section URLs (8 links) |
| `public/.well-known/ai.txt` | Update header comment URL |

---

### 3. index.html (Social/SEO Tags)

**File:** `index.html`

Update hardcoded URLs in:
- Line 49: canonical link
- Line 54: og:url
- Line 55: og:image
- Line 59: twitter:url  
- Line 60: twitter:image
- Line 76: iframe check (if applicable)

---

### 4. Edge Function Fallbacks

These use `APP_URL` or `SITE_URL` env vars but have incorrect hardcoded fallbacks:

| File | Current Fallback | Fix |
|------|------------------|-----|
| `supabase/functions/_shared/email-template.ts` | `quote.harrisboatworks.ca` | `mercuryrepower.ca` |
| `supabase/functions/send-saved-quote-email/index.ts` | `quote.harrisboatworks.ca` | `mercuryrepower.ca` |
| `supabase/functions/send-deposit-confirmation-email/index.ts` | `quote.harrisboatworks.ca` | `mercuryrepower.ca` |
| `supabase/functions/send-promo-notifications/index.ts` | `quote.harrisboatworks.ca` | `mercuryrepower.ca` |
| `supabase/functions/subscribe-promo-reminder/index.ts` | `quote.harrisboatworks.ca` | `mercuryrepower.ca` |
| `supabase/functions/send-blog-notification/index.ts` | `harrisboatworks.com` | `mercuryrepower.ca` |
| `supabase/functions/subscribe-blog/index.ts` | `harrisboatworks.com` | `mercuryrepower.ca` |
| `supabase/functions/send-financing-resume-email/index.ts` | `harrisboatworks.com` | `mercuryrepower.ca` |
| `supabase/functions/send-financing-confirmation-email/index.ts` | `harrisboatworks.com` | `mercuryrepower.ca` |

---

### 5. Other Hardcoded References (Review Needed)

These contain `harrisboatworks.ca` but may be intentional (business contact info vs. app URLs):

| File | Context | Action |
|------|---------|--------|
| `src/lib/pdf-executive.ts` | QR code URL + footer | Update to mercuryrepower.ca |
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Footer "www.harrisboatworks.ca" | Update to mercuryrepower.ca |
| `supabase/functions/scrape-motor-prices/index.ts` | Source URL for price scraping | Keep as-is (actual source site) |
| Email templates | `info@harrisboatworks.ca` contact email | Keep as-is (valid email address) |

---

## Files to Modify

| Priority | File | Change |
|----------|------|--------|
| **High** | `src/lib/site.ts` | Single line change - cascades everywhere |
| **High** | `index.html` | Meta tags for social sharing |
| **High** | `public/sitemap.xml` | All URLs for SEO |
| **High** | `public/robots.txt` | Sitemap reference |
| **Medium** | `public/llms.txt` | AI discovery URLs |
| **Medium** | `public/.well-known/ai.txt` | AI agent metadata |
| **Medium** | 9 edge functions | Fallback URLs |
| **Low** | 2 PDF generators | Footer URLs |

---

## What Stays Unchanged

- **Email addresses**: `info@harrisboatworks.ca`, etc. - valid business contacts
- **From addresses**: `noreply@hbwsales.ca` - verified Resend domain
- **Price scraping URL**: Points to actual source website
- **Physical address**: Harris Boat Works Rd (real location)

---

## Post-Update Steps

1. **DNS Setup**: Configure A records for `mercuryrepower.ca` → Lovable's IP (`185.158.133.1`)
2. **Add TXT Record**: `_lovable` verification record
3. **Connect in Lovable**: Add the domain in Project Settings → Domains
4. **Environment Variable**: Set `SITE_URL=https://mercuryrepower.ca` in Supabase secrets (optional but recommended)
