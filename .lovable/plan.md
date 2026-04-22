

## Add real Pro XS variant images to schema

Replace the shared `/social-share.jpg` placeholder with HP-specific Mercury product photos in the JSON-LD `hasVariant` Products. This unlocks Google Merchant Listings rich-result eligibility for each Pro XS HP tier.

### Image source

Mercury Marine's CDN follows a stable, predictable pattern already used elsewhere in the codebase (`src/lib/mercury-product-images.ts`):

```
https://www.mercurymarine.com/content/dam/mercury-marine/images/outboards/proxs/{slug}/en-us-canada/{slug}-gallery-1.jpg
```

Mapping per HP:

| HP  | Image URL |
|-----|-----------|
| 115 | `.../proxs/115hp-proxs/en-us-canada/115hp-proxs-gallery-1.jpg` |
| 150 | `.../proxs/150hp-proxs/en-us-canada/150hp-proxs-gallery-1.jpg` |
| 200 | `.../proxs/200hp-proxs/en-us-canada/200hp-proxs-gallery-1.jpg` |
| 250 | `.../proxs/250hp-proxs/en-us-canada/250hp-proxs-gallery-1.jpg` |

These are public, hot-linkable (same CDN pattern as existing `mercury-product-images.ts` entries) and HP-specific.

### Files to update

**1. `src/components/seo/MercuryProXSSEO.tsx`**
- Replace the single `PRO_XS_DEFAULT_IMAGE` constant strategy with a per-variant `image` URL.
- Set `image` on each entry of `PRO_XS_STATIC_OFFERS` to the matching Mercury CDN URL above.
- Keep `PRO_XS_DEFAULT_IMAGE` as a fallback constant (for safety) but stop using it in the offers array.

**2. `scripts/static-prerender.mjs`**
- Mirror the same image URLs in `PRO_XS_STATIC_OFFERS_PRERENDER` (around line 1042) so the prerendered HTML JSON-LD matches the runtime React JSON-LD exactly.
- Both must agree — Google reads the prerendered version, the runtime version handles SPA navigations.

### Verification

After edit:
1. `npm run build` to regenerate prerender output.
2. `curl -s https://www.mercuryrepower.ca/mercury-pro-xs | grep -o '"image":"[^"]*proxs[^"]*"' | head` — confirm 4 distinct HP-specific image URLs in the JSON-LD blob.
3. Spot-check one image URL returns 200 (e.g., `curl -I {115 url}`).
4. Test in Google's [Rich Results Test](https://search.google.com/test/rich-results) against `/mercury-pro-xs` — Product variants should now show with images.

### What stays unchanged

- No schema structure changes (still `ProductGroup` → `hasVariant` → `Product` → `Offer`).
- No price changes.
- No FAQ changes.
- No route changes.

### Risk / rollback

If any Mercury CDN URL 404s during QA, fall back to `PRO_XS_DEFAULT_IMAGE` for that single variant — schema stays valid either way. Easy single-line revert per variant.

