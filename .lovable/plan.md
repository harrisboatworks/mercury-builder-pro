

# Add Google Search Console Verification Meta Tag

## What
Add the Google Search Console verification meta tag to `index.html` so Google can verify ownership of mercuryrepower.ca and begin proper crawling.

## Change

### `index.html`
Add this line inside the `<head>` section, after the existing meta tags (around line 13, after the GA config script):

```html
<meta name="google-site-verification" content="dQ0cAABotsaEYxoKgsE1OhdGpZ_UayYlQHM6vPZLCIw" />
```

## After Deploy
Hit **Verify** in your Google Search Console tab. Once verified, Google will begin crawling mercuryrepower.ca properly.

## Files

| File | Change |
|------|--------|
| `index.html` | Add GSC verification meta tag to `<head>` |

