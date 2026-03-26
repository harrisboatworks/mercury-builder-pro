

# Individual Motor URLs for AI Search Domination

## What Claude Found

Your 93 Product schemas are already excellent — brand, price, SKU, availability all correct. Two gaps remain:

1. **Every product schema URL points to `/quote/motor-selection`** — so ChatGPT links to your general page, not a specific motor
2. **Sitemap has no individual motor URLs** — search crawlers don't know those pages exist

## What Already Exists

- `/motors/:slug` route already works (e.g. `/motors/fourstroke-150hp-efi-elpt-ct`)
- `ShareLinkButton` already builds correct slugs from `model_key`
- `MotorRedirect.tsx` resolves slugs back to the right motor

## The Fix (Two Small Changes)

### 1. Product Schema: Use Individual Motor URL

**File**: `src/components/motors/MotorCardPreview.tsx`

Change the `"url"` in `getProductSchema()` from:
```
"url": `${siteUrl}/quote/motor-selection`
```
to:
```
"url": `${siteUrl}/motors/${slug}`
```

Using the same `buildSlug()` logic from `ShareLinkButton` (import or inline it). This means when ChatGPT sees a Mercury 150 Pro XS product, it links directly to `/motors/fourstroke-150hp-efi-elpt` instead of the generic page.

### 2. Sitemap: Add All Motors Dynamically

**File**: `src/utils/generateSitemap.ts`

Add a function that fetches all `model_key` values from the `motor_models` table and generates sitemap entries for each `/motors/{slug}` URL with priority 0.7. This tells Google and AI crawlers that every motor has its own page.

**File**: `public/sitemap.xml`

Update the static sitemap to include representative motor URLs (the dynamic generation handles the full list at build time, but having some in the static file helps crawlers discover the pattern).

### 3. Sitemap also in llms.txt

**File**: `public/llms.txt`

Add a section listing the `/motors/` URL pattern so AI crawlers know individual motor pages exist.

## Result

- ChatGPT answer to "where can I buy a Mercury 150 Pro XS in Ontario" → links to `mercuryrepower.ca/motors/proxs-150hp-efi-xl` instead of the generic page
- Google indexes 93 individual motor URLs
- Zero user-facing changes — the redirect still works exactly the same

## Files

| File | Change |
|------|--------|
| `src/components/motors/MotorCardPreview.tsx` | Product schema URL → `/motors/{slug}` |
| `src/utils/generateSitemap.ts` | Add motor entries to sitemap generation |
| `public/sitemap.xml` | Add representative motor URLs |
| `public/llms.txt` | Document motor URL pattern |

