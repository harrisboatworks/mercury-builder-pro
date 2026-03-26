

# Fix: Static Files Returning 404 Due to PWA Service Worker

## Root Cause

In `vite.config.ts`, the PWA workbox config has:
```
navigateFallback: '/index.html',
navigateFallbackDenylist: [/^\/api/, /^\/rest/]
```

This means the service worker intercepts requests to `/sitemap.xml`, `/rss.xml`, `/robots.txt`, `/llms.txt`, and the Google verification HTML file — serving `index.html` instead of the actual static files.

## Fix

### `vite.config.ts` (line 127)

Expand `navigateFallbackDenylist` to exclude all static file paths:

```js
navigateFallbackDenylist: [
  /^\/api/,
  /^\/rest/,
  /\.xml$/,
  /\.txt$/,
  /\.csv$/,
  /^\/googlebdeec341596163e7\.html$/
]
```

This tells the service worker: "Don't intercept requests ending in `.xml`, `.txt`, `.csv`, or the Google verification file — let them through to the server."

## Files

| File | Change |
|------|--------|
| `vite.config.ts` | Expand `navigateFallbackDenylist` to exclude `.xml`, `.txt`, `.csv`, and verification file |

