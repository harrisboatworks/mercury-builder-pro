

## Add Bing Webmaster verification meta tag to index.html

Replace the existing placeholder Bing verification tag in `index.html` with the real token. The Google Search Console tag is already present with a valid token (`dQ0cAABotsaEYxoKgsE1OhdGpZ_UayYlQHM6vPZLCIw`), so it stays untouched.

### Change

In `index.html`, line 26 currently reads:
```html
<meta name="msvalidate.01" content="BING_VERIFICATION_TBD" />
```

Replace with:
```html
<meta name="msvalidate.01" content="DA6209164BA72CB3C538414AB0F0235F" />
```

The comment above it (`<!-- Bing Webmaster Tools verification — replace placeholder after submitting at bing.com/webmasters -->`) is removed since the token is now real.

Nothing else in `index.html` changes. The existing GSC tag (line 14) stays as-is.

### Deploy

Commit pushes to GitHub `harrisboatworks/mercury-builder-pro`; Vercel auto-deploys from `main`. The tag is then visible in the prerendered HTML on `mercuryrepower.ca` and Bing can verify ownership.

### Note

The instruction says "do not remove after verification" — confirmed. The tag is permanent.

