

## What's actually wrong

Production is **not** broken the way the audit claims. `www.mercuryrepower.ca/mercury-pro-xs`, `/faq`, and the other landing pages all return real prerendered HTML with correct titles, H1s, and JSON-LD. Verified directly against the deployed bundle.

The audit was run against the **apex** `mercuryrepower.ca` (no `www`), which 307-redirects to `www.`. The auditor's headless tool didn't follow the redirect, so it saw the 1-line "Redirecting..." body and reported `h1: 404`, `jsonLd: 0`. False alarm.

But the audit did surface a real, separate problem worth fixing.

## The real bug: canonical/host mismatch

- Vercel forces all traffic to `www.mercuryrepower.ca` (307 from apex).
- Every prerendered page emits `<link rel="canonical" href="https://mercuryrepower.ca/...">` — the apex, no `www`.
- So Google fetches `www.mercuryrepower.ca/mercury-pro-xs`, reads "the canonical is the apex," follows the apex, gets 307'd back. Self-conflicting signal.
- `SITE_URL` in `src/lib/site.ts` is hardcoded to `https://mercuryrepower.ca` (apex), which feeds every canonical, OG URL, JSON-LD `@id`, sitemap entry, and RSS link.

This needs to be reconciled to one host. Pick the one Vercel actually serves.

## Plan

### 1. Decide canonical host
Vercel currently serves `www`. Two options:

**Option A (recommended — least risk):** Make `www` canonical everywhere.
- Change `SITE_URL` default in `src/lib/site.ts` from `https://mercuryrepower.ca` → `https://www.mercuryrepower.ca`.
- Set Vercel env `VITE_SITE_URL=https://www.mercuryrepower.ca` for the production environment so every build picks it up regardless of source.
- Keep apex → www 307 (or upgrade to 301 in Vercel domain settings for stronger SEO signal).
- Result: canonical, OG, JSON-LD, sitemap, RSS, prerendered HTML all agree on `www.`. Apex still works via redirect.

**Option B:** Make apex canonical.
- Flip Vercel's preferred domain from `www` → apex (Project → Domains → set apex as primary).
- `www` will then 307 → apex, matching the existing canonical strings.
- Riskier because every external link, share, and historical Google index entry currently points at `www.` after the redirect.

I'll proceed with **Option A** unless you say otherwise — it requires no Vercel domain reconfiguration and matches what production already serves.

### 2. Apply the change
- Edit `src/lib/site.ts`: default `SITE_URL` to `https://www.mercuryrepower.ca`.
- Verify nothing else hardcodes the apex string. Search `src/`, `scripts/static-prerender.mjs`, `public/sitemap.xml`, `public/rss.xml`, `public/llms.txt`, `public/robots.txt` for `mercuryrepower.ca` without `www.` and update.
- Rebuild and redeploy (Vercel auto-deploys from `main`).

### 3. Verify
For each route below, confirm with `curl` against `www.mercuryrepower.ca`:
- title is page-specific (not the generic site title)
- H1 is unique and not "404"
- `application/ld+json` count ≥ 1
- `<link rel="canonical">` matches the requested URL exactly (with `www`)

Routes to verify:
```
/mercury-pro-xs
/mercury-outboards-ontario
/mercury-pontoon-outboards
/mercury-repower-faq
/how-to-repower-a-boat
/mercury-dealer-peterborough
/mercury-dealer-cobourg
/mercury-dealer-gta
/agents
/about
/contact
/faq
```

### 4. Pro XS variant images (separate item from prior audit)
Add a real image URL per Pro XS variant (`PRO_XS_STATIC_OFFERS` in `src/components/seo/MercuryProXSSEO.tsx` and the prerender mirror in `scripts/static-prerender.mjs`). Currently all four point to `/social-share.jpg` as a placeholder, which technically satisfies the schema but won't get Merchant Listings rich results.
- Need from you: 4 hosted image URLs (115/150/200/250 Pro XS) from Mercury's catalog or HBW's own product photography. If unavailable today, keep the shared placeholder — schema stays valid.

### 5. Reply to the auditor
Once verified, the response is: production was always serving correct content on `www.`; the audit hit the apex redirect and misread it. Canonical mismatch has been fixed so headless audits and Google now see a consistent host.

## Technical details

- Files touched: `src/lib/site.ts`, possibly small string updates in `scripts/static-prerender.mjs`, `public/sitemap.xml`, `public/rss.xml`, `public/llms.txt`, `src/components/seo/MercuryProXSSEO.tsx`.
- No route changes needed in `App.tsx` — routing is correct, prerender is correct, Vercel rewrites are correct.
- No Vercel config change required for Option A (the apex → www redirect already exists at the platform level).
- Build/deploy: `npm run build` runs the static prerender; Vercel deploys on push to `main`.

