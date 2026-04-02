

# Fix Missing Card Image for 60 ELPT FourStroke

## Problem
The 60 ELPT FourStroke has 5 valid images in its `images` array but no `hero_image_url`, `image_url`, or `hero_media_id`. The parent computes `heroImage` as empty string, passing `img=""` to the card. The card then relies on deferred async resolution via IntersectionObserver + `getMotorImageByPriority`, which can fail to render before the user sees the card. The modal works because it calls `getMotorImageGallery` separately on open.

## Root cause
Two places compute the hero image without falling back to the `images` array:

1. **Line 522** in `MotorSelectionPage.tsx`: `heroImage = dbMotor.hero_image_url || dbMotor.image_url || ''` — never checks `images[]`
2. **Line 1097** in `MotorSelectionPage.tsx`: `heroImageUrl = hero_media?.media_url || image_url || motor.image || ''` — `motor.image` is already empty

## Fix

### `src/pages/quote/MotorSelectionPage.tsx`

**Line 522**: After computing `dbImages`, use the first image as a fallback for `heroImage`:
```
// Before
const heroImage = dbMotor.hero_image_url || dbMotor.image_url || '';
const dbImages = ...

// After  
const dbImages = ... (move up)
const firstDbImage = dbImages.length > 0 ? dbImages[0] : null;
const heroImage = dbMotor.hero_image_url || dbMotor.image_url || firstDbImage || '';
```

**Line 1097**: Add `motor.images?.[0]` as another fallback:
```
const heroImageUrl = (dbMotor as any)?.hero_media?.media_url 
  || dbMotor?.image_url 
  || motor.image 
  || motor.images?.[0] 
  || '';
```

### Also reset `imageError` on URL change in `MotorCardPreview.tsx`

Add a `useEffect` to reset `imageError` when `imageInfo.url` changes, preventing stale error states from blocking newly resolved images.

## Files changed
| File | Change |
|------|--------|
| `src/pages/quote/MotorSelectionPage.tsx` | Fall back to first image from images array for hero image (lines 522 and 1097) |
| `src/components/motors/MotorCardPreview.tsx` | Reset `imageError` when image URL changes |

