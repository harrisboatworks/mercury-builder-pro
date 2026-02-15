
## Fix Share Link: Broken Slugs + Auto-Open Motor Modal

Three issues to fix:

### Bug 1: `model_key` Not Fetched
The motor query in `MotorSelection.tsx` (line 409-412) doesn't include `model_key` in the SELECT, so it's always `undefined`. The ShareLinkButton then falls back to `model` or `model_display` (e.g., "6MH FourStroke"), producing URLs with spaces like `/motors/6mh fourstroke`.

**Fix:** Add `model_key` to the select query in `MotorSelection.tsx`.

### Bug 2: `buildSlug` Not Robust
Even with `model_key` available, the slug builder should handle edge cases (spaces, special chars) as a safety net.

**Fix:** Update `buildSlug` in `ShareLinkButton.tsx` to also strip spaces and non-URL-safe characters.

### Bug 3: Share Link Doesn't Open the Motor Modal
Currently `/motors/fs-6-mh` redirects to `/quote/motor-selection?motor=ID`, but nothing in MotorSelection reads that `?motor=` param. The user lands on the full motor list with nothing highlighted.

**Fix:** Add logic in `MotorSelection.tsx` to read the `motor` URL param on mount. When present, find that motor in the list and automatically open its detail modal (the same one that opens when you click a card).

### Files Changed

1. **`src/components/quote-builder/MotorSelection.tsx`**
   - Add `model_key` to the Supabase select query
   - On mount, read `?motor=` param; if present, find matching motor and auto-trigger its detail modal open

2. **`src/components/motors/ShareLinkButton.tsx`**
   - Make `buildSlug` more robust: replace spaces with dashes, strip non-alphanumeric characters (except dashes), collapse multiple dashes
