

# Google Search Console Verification via HTML File Upload

The meta tag approach isn't being detected by Google's crawler. The alternative is the **HTML file verification method** — place the verification file at the site root so Google can fetch it directly.

## Change

### Copy verification file to `public/`
Copy `googlebdeec341596163e7.html` to `public/googlebdeec341596163e7.html` so it's served at `https://mercuryrepower.ca/googlebdeec341596163e7.html`.

### Update `vercel.json` (if needed)
Ensure the file isn't caught by the SPA catch-all rewrite. Add a rule so `/googlebdeec341596163e7.html` serves the static file directly before the wildcard route.

## Files

| File | Change |
|------|--------|
| `public/googlebdeec341596163e7.html` | Copy verification file here |
| `vercel.json` | Ensure static file isn't rewritten to index.html |

## After Deploy
Hit **Verify** in Google Search Console. The file method is more reliable than meta tags for SPAs.

