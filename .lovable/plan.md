

## Add root-path redirect rule to vercel.json

The existing `/:path*` redirect doesn't match the bare root `/` on Vercel, so `quote.harrisboatworks.ca/` still returns HTTP 200. Add a dedicated rule for root, keeping the catch-all rule intact.

### Change

In `vercel.json`, prepend a new redirect rule before the existing one. Final `redirects` array:

```json
"redirects": [
  {
    "source": "/",
    "has": [{ "type": "host", "value": "quote.harrisboatworks.ca" }],
    "destination": "https://www.mercuryrepower.ca/",
    "statusCode": 301
  },
  {
    "source": "/:path*",
    "has": [{ "type": "host", "value": "quote.harrisboatworks.ca" }],
    "destination": "https://www.mercuryrepower.ca/:path*",
    "statusCode": 301
  }
]
```

Nothing else in `vercel.json` changes — rewrites, headers, and the cron rule are untouched.

### Deploy & verify

The commit pushes to GitHub `harrisboatworks/mercury-builder-pro`; Vercel auto-deploys from `main`. Once the deploy completes, I'll run:

```bash
curl -sI https://quote.harrisboatworks.ca/
curl -sI https://quote.harrisboatworks.ca/repower
```

Expected: both return `HTTP/2 301` with `location:` pointing to the matching `www.mercuryrepower.ca` path.

