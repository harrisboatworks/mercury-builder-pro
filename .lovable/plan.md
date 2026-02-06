

# Fix Missing Blog Post Images

## Problem

Two currently-published blog posts show broken images because they reference `.jpg` placeholder filenames that don't exist in `public/lovable-uploads/`. This is not related to the domain change -- these files were never uploaded. Many future scheduled articles also reuse these same phantom filenames.

**Broken now (published):**
- "Mercury 75 vs 90 vs 115" (Jan 26) points to `mercury-comparison.jpg` -- does not exist
- "Ontario Cottage Owner's Guide" (Feb 2) points to `repower-hero.jpg` -- does not exist

**Broken in the future (scheduled):**
- 12+ upcoming articles reuse `mercury-comparison.jpg`, `mercury-service.jpg`, `mercury-fishing.jpg`, and `repower-hero.jpg`

## Fix

### 1. Reassign the two live articles to existing images

Swap the missing `.jpg` references to real `.png` images that already exist and thematically match:

| Article | Old (missing) | New (exists) |
|---|---|---|
| Mercury 75 vs 90 vs 115 | `mercury-comparison.jpg` | `Comparing_Motor_Families.png` |
| Ontario Cottage Owner's Guide: Repower | `repower-hero.jpg` | `Boat_Repowering_101_Hero.png` |

### 2. Add a fallback image to BlogCard

Update `src/components/blog/BlogCard.tsx` to handle broken images gracefully. If the `<img>` tag fails to load, show a branded fallback (Mercury red gradient with the Harris Boat Works name) instead of a broken icon. This prevents future scheduled articles from looking broken if their hero images haven't been uploaded yet.

### 3. Bulk-replace future placeholder references

Replace all remaining phantom `.jpg` references across the scheduled articles with thematically appropriate existing `.png` images:

| Placeholder | Replacement |
|---|---|
| `mercury-comparison.jpg` (4 articles) | `Comparing_Motor_Families.png` |
| `mercury-service.jpg` (5 articles) | `Mercury_Maintenance_Schedule.png` |
| `mercury-fishing.jpg` (2 articles) | `Best_Mercury_Outboard_Rice_Lake_Fishing.png` |
| `repower-hero.jpg` (1 article) | `Boat_Repowering_101_Hero.png` |

This ensures every article has a working image today, while the fallback handler acts as a safety net for any future posts added without images.

## Files Changed

- **`src/data/blogArticles.ts`** -- Replace all 12+ phantom `.jpg` image references with existing `.png` files
- **`src/components/blog/BlogCard.tsx`** -- Add `onError` fallback so broken images show a branded placeholder instead of a broken icon

