

## Investigation Results: Missing Motor Card Images

### Root Cause

There are **two separate issues** causing "No Image Available" on motor cards:

---

### Issue 1: Motors with motor_media records but no `hero_media_id` set

These motors have images uploaded and linked in the `motor_media` table, but the `hero_media_id` field on `motor_models` was never set. The rendering chain on `MotorSelectionPage` (line 1033) tries to resolve the image synchronously via the joined `hero_media` relation — when that's null, it falls back to `/lovable-uploads/speedboat-transparent.png`.

The async `getMotorImageByPriority` in `MotorCardPreview` **should** catch these via Priority 6 (querying `motor_media` by `motor_id`), but either there's a timing issue or the fallback image is being set before the async call resolves visually.

**Affected motors (have media, missing hero link):**
- 9.9MLH FourStroke — 4 images in motor_media
- 25 ELPT FourStroke — 2 images
- 115 ELPT ProXS — 21 images

**Fix:** Run a SQL update to auto-set `hero_media_id` from the first active image in `motor_media` for these motors.

---

### Issue 2: Motors with zero images anywhere

These motors have no `hero_image_url`, no `image_url`, no `hero_media_id`, and no `motor_media` records at all. The template-motor fallback in `getMotorImageByPriority` (Priority 6) tries to find another motor at the same HP with a `hero_image_url`, but many HP groups don't have any motor with that field set either.

**Affected motors (no images at all) — ~30 motors including:**
- 8EH, 8ELH, 8MH FourStroke
- 9.9ELH FourStroke
- 15EHPT, 15ELHPT ProKicker, 15ELPT ProKicker
- 20 ELHPT FourStroke
- 25 MLH, 25ELPT ProKicker, 25EXLPT ProKicker
- 30 ELHPT, 30 ELPT
- 40 ELHPT, 40 ELPT
- 50 ELHPT
- 60 ELHPT CT Tiller, 60 ELHPT Tiller, 60 ELPT
- 90 ELPT
- 150 EXLPT ProXS, 150 XL
- 175 variants, 200 variants, 225+

**Fix:** Improve the same-HP fallback to also check `hero_media_id` joins, and broaden the template matching to use motors that have `motor_media` records (not just `hero_image_url`).

---

### Proposed Plan

#### Step 1: Database fix — Auto-link hero images for motors that have media
Run a migration that sets `hero_media_id` from the first active image in `motor_media` for any motor where `hero_media_id IS NULL` but motor_media records exist.

#### Step 2: Improve same-HP fallback in `getMotorImageByPriority`
Update Priority 6 in `src/lib/motor-helpers.ts` (lines 722-736) to also check for template motors that have a `hero_media_id` (not just `hero_image_url`), and query their `motor_media` URL.

#### Step 3: Improve `MotorSelectionPage` hero image resolution
Update line 1033 in `src/pages/quote/MotorSelectionPage.tsx` to pass an empty string instead of the fallback image when no hero is found, so `MotorCardPreview` always runs the full async priority chain rather than displaying the placeholder prematurely.

### Technical Details

- **Files to modify:**
  - `src/lib/motor-helpers.ts` — Expand Priority 6 template fallback
  - `src/pages/quote/MotorSelectionPage.tsx` — Fix hero image resolution at line 1033
  - New SQL migration — Auto-set `hero_media_id` for unlinked motors

- **No risk to existing working images** — Changes only affect motors currently showing "No Image Available"

