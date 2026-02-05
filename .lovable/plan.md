
# Complete Domain Switch to mercuryrepower.ca

## Current State

- ✅ All codebase fallbacks already updated to `mercuryrepower.ca`
- ✅ Static files (sitemap, robots.txt) already point to new domain
- ✅ Edge functions already have correct fallbacks
- ✅ mercuryrepower.ca is LIVE in Lovable
- ⏳ `.env` file still points to old domain

## Change Required

**File:** `.env`

```env
# Before
VITE_SITE_URL="https://quote.harrisboatworks.ca"

# After
VITE_SITE_URL="https://mercuryrepower.ca"
```

## What This Affects

Once updated, all runtime URLs will use mercuryrepower.ca:
- SEO canonical links
- Open Graph/Twitter share URLs
- Blog article share buttons
- PDF QR codes
- Structured data schemas

## What Stays Working

- **quote.harrisboatworks.ca** will continue to work (it's still connected in Lovable)
- Old shared links will still function
- Both domains will serve the same content

## Risk Level

**Very Low** - Since mercuryrepower.ca is already live and serving the site, this just changes which domain appears in generated URLs and SEO metadata.
