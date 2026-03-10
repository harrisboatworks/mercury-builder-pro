

# Fix Blog Post Hero Image Cropping

## Problem
The blog article hero images use a fixed `aspect-[16/9]` container with `object-cover`, which crops images that aren't exactly 16:9. Since these are designed hero images with text overlays, logos, and intentional compositions, cropping cuts off important content (as seen in the boat rentals post screenshot where the title text is partially clipped at the top).

The same issue applies to `BlogCard` thumbnails on the blog index page.

## Fix

### `src/pages/BlogArticle.tsx` — Hero image (line 306-312)
- Change from `aspect-[16/9]` with `object-cover` to `object-contain` so the full designed image is always visible
- Use `bg-muted` as the letterbox background for images that aren't 16:9
- Keep `rounded-xl` and `overflow-hidden`

### `src/components/blog/BlogCard.tsx` — Thumbnail (line 17-34)
- Keep `aspect-[16/9]` container for consistent card layout on the grid
- Change `object-cover` to `object-contain` so card thumbnails also show the full image without cropping
- The `bg-muted` background already handles letterboxing

### Both files
- Add `onError` fallback on the BlogArticle hero (it's missing — BlogCard already has it)

