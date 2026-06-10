## Goal

Repair two production agent-discovery surfaces so they contain the keywords required by the validation rules. No price, promo, or strategy changes.

## What I found

- `scripts/static-prerender.mjs` is the last writer for `public/catalog.md` and for the prerendered `/agents` HTML (it overwrites both at the end of `npm run build`).
- `scripts/generate-markdown-twins.mjs` writes `public/catalog.md` earlier in the build and produces the in-repo committed copy; for consistency it should mirror the same change.
- Current `public/catalog.md` contains `pickup` (7x) but contains **0** occurrences of `public-motors-api` or `build_quote`. The "Public quote API" section only renders the URL via a template literal that resolves to `.../public-quote-api`, never the literal strings the validator looks for.
- Current `/agents` prerender intro + noscript mentions MCP, REST APIs, deep-link quote URLs, but the literal words `pickup` and `install`/`installation` are not present anywhere in the prerendered text content for that route.

## Edits

### 1. `scripts/static-prerender.mjs` — `/agents` route entry (around line 4066)

Extend the `intro` string (or add one small `<section>` to `extraNoscript`) so the prerendered HTML for `/agents` contains the literal words `pickup` and `installation`. Concretely, append one sentence to the intro:

> "Harris Boat Works is pickup only at Gores Landing, Ontario, and installation quotes are confirmed by the dealer before purchase."

No change to schemas, no change to existing sections.

### 2. `scripts/static-prerender.mjs` — `catalogMarkdown()` (around line 5290)

In the existing "Public quote API" section, replace the single line with a short block that names both endpoints by their literal slugs so the validator's regex hits:

```
## Public quote API

- `POST https://.../public-quote-api` with `action: "build_quote"` builds an itemized CAD quote.
- `GET  https://.../public-motors-api` returns the live Mercury inventory feed.

See any motor twin for an example body.
```

No change to "Business rules", "What we do NOT offer", motor/case-study/location/blog sections, positioning paragraph, pricing reference link, or MCP discovery block.

### 3. `scripts/generate-markdown-twins.mjs` — `catalogMarkdown()` (around line 759-770)

Apply the same "Public quote API" rewrite so the pre-Vite-built `public/catalog.md` matches the prerender output. No other edits.

### 4. Rebuild + publish

- Run `node scripts/generate-markdown-twins.mjs` and `node scripts/static-prerender.mjs` locally as a smoke check is not needed; the production build runs both. Just publish via the publish tool.
- After publish, fetch each URL and report:
  - `/agents` — confirm `pickup` and `install`/`installation` are present.
  - `/catalog.md` — confirm `public-motors-api` and `build_quote` are present.
  - `/.well-known/ai.txt` — confirm 200 and unchanged.
  - `/.well-known/mcp.json` — confirm 200 and unchanged.
  - `/pricing-reference` — confirm 200.
  - `/pricing-reference.md` — confirm 200.
  - `/mercurypricelist` — confirm 301 to `/pricing-reference` (this is a Vercel redirect; will not be touched by this change).
- Report sitemap URL count from `/sitemap.xml`.

## Out of scope

- No edits to prices, promotions, financing rules, pricing-reference content, route strategy, or UI components.
- No changes to redirects, `vercel.json`, ai.txt, mcp.json, or pricing-reference markdown.
