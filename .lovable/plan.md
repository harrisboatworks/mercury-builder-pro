

# Fix: Login Redirect to Wrong Domain

## Problem
When logging in on `mercuryrepower.ca`, OAuth (Google/Facebook) redirects to `https://quote.harrisboatworks.ca/` instead of staying on the correct domain.

## Root Cause
Two issues working together:

1. **Supabase Auth Configuration** (Dashboard setting, not code): The Supabase project's **Site URL** and **Redirect URL allowlist** likely still point to `quote.harrisboatworks.ca`. When OAuth returns, Supabase checks the requested `redirectTo` URL against the allowlist. If `mercuryrepower.ca` isn't listed, Supabase falls back to the old Site URL.

2. **Hardcoded old domain in code**: There are ~220 references to `quote.harrisboatworks.ca` across SEO components, sitemap generator, SMS templates, and other files.

## Solution

### Step 1: Update Supabase Auth Settings (Manual - Dashboard)
You need to update these in your Supabase Dashboard (Authentication > URL Configuration):

- **Site URL**: Change from `https://quote.harrisboatworks.ca` to `https://mercuryrepower.ca`
- **Redirect URLs**: Add these entries:
  - `https://mercuryrepower.ca/**`
  - `https://mercury-quote-tool.lovable.app/**`
  - Keep `https://quote.harrisboatworks.ca/**` temporarily for backward compatibility

### Step 2: Replace Hardcoded Domain References in Code
Update all `quote.harrisboatworks.ca` references to use `mercuryrepower.ca`. The affected files are:

| File | What to change |
|------|---------------|
| `src/utils/generateSitemap.ts` | `BASE_URL` constant |
| `src/components/seo/FinancingSEO.tsx` | All canonical/OG/structured data URLs |
| `src/components/seo/BlogIndexSEO.tsx` | All canonical/OG/structured data URLs |
| `src/components/seo/PromotionsPageSEO.tsx` | All canonical/OG/structured data URLs |
| `src/components/seo/BlogArticleSEO.tsx` | All canonical/OG/structured data URLs (if exists) |
| `src/components/seo/IndexPageSEO.tsx` | All canonical/OG/structured data URLs (if exists) |
| `src/components/quote-builder/ScheduleConsultation.tsx` | Admin SMS link |
| `supabase/functions/voice-send-follow-up/index.ts` | SMS template links |

All hardcoded URLs will be replaced with the `SITE_URL` constant from `src/lib/site.ts` (which already resolves to `https://mercuryrepower.ca`) or with the direct `mercuryrepower.ca` string where imports aren't available (edge functions).

### Step 3: Auth Provider - Use SITE_URL for Redirects
Update `src/components/auth/AuthProvider.tsx` to import and use `SITE_URL` for OAuth redirects instead of `window.location.origin`. This ensures consistent redirect URLs regardless of which domain the user is currently on:

```
redirectTo: redirectTo || `${SITE_URL}/`
```

## Important Note
**Step 1 (Supabase Dashboard) is the critical fix** for the login redirect issue. Without adding `mercuryrepower.ca` to the redirect allowlist, the code changes alone won't fix OAuth login. You'll need to do this manually in your Supabase Dashboard at:
`https://supabase.com/dashboard/project/eutsoqdpjurknjsshxes/auth/url-configuration`

