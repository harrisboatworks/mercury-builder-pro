

## Problem: 115 ELPT FourStroke has no images

The 115 ELPT FourStroke (`eee34e36`) and 115 EXLPT FourStroke (`fc97c532`) have completely empty image data:
- `image_url`: null
- `hero_image_url`: null
- `hero_media_id`: null
- `images`: empty array
- No `motor_media` records

The fallback chain in `getMotorImageByPriority` eventually reaches the "same-HP sibling" queries, but the only *active* `motor_media` at 115HP belongs to the **Pro XS** family — visually wrong for a FourStroke card. The actual FourStroke images exist on the Command Thrust variants but are all marked `is_active=false`.

Meanwhile, `mercury-product-images.ts` already has a CDN fallback for 115HP FourStroke imagery, but the priority chain never reaches it because Priority 7 returns the generic speedboat placeholder instead of checking the CDN map.

## Fix (two parts)

### 1. Database: Activate the existing FourStroke 115 images and assign them

The Command Thrust 115 FourStroke variants already have good motor_media images (e.g., `Main-115hp-4S.jpg`, port/starboard shots). These are the same cowling as the non-CT models. Migration will:

- Reactivate the best FourStroke 115 motor_media images (currently `is_active=false`)
- Create motor_media records linking those same storage URLs to the 115 ELPT and 115 EXLPT FourStroke models
- Set `hero_media_id` on both models to point to the best hero shot

### 2. Code: Add Mercury CDN fallback before the generic placeholder

In `getMotorImageByPriority`, before returning the speedboat placeholder at Priority 7, add a check against `mercuryProductImages` using the motor's HP. This ensures any motor with a matching CDN entry never shows "No Image Available."

```text
Priority chain (updated):
  1. hero_media_id → motor_media lookup
  2. In-stock inventory images
  3. hero_image_url
  4. images array
  5. image_url
  6. motor_media table (own + same-HP siblings)
  7. Mercury CDN static map  ← NEW
  8. Speedboat placeholder
```

This is a safety net that prevents any supported HP from ever showing the placeholder.

