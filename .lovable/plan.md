

## Fix Share Links: Slug Generation + Modal Auto-Open

There are two distinct bugs causing the broken experience:

### Bug 1: Wrong slug still being generated

**Root cause:** `MotorSelectionPage.tsx` (the actual page rendering motor cards) fetches `model_key` via `SELECT *`, but drops it during the Motor type conversion at line 531. The `convertedMotor` object never includes `model_key`, so it's always `undefined` when it reaches the `ShareLinkButton`. The button then falls back to `motor.model` (e.g., "6MH FourStroke"), producing the broken slug `6mh-fourstroke`.

**Fix:** Add `model_key: dbMotor.model_key || null` to the motor mapping in `MotorSelectionPage.tsx` (around line 530, alongside the existing `shaft` and `images` fields).

### Bug 2: Modal doesn't open on redirect

**Root cause:** The deep-link handler (line 706-729) searches for the motor by ID within `groupedMotors`, which groups motors by HP. When it finds a match, it calls `setSelectedGroup(targetGroup)` and `setShowConfigurator(true)`. However, the motor appeared in the bottom bar (via `SET_PREVIEW_MOTOR` dispatched elsewhere) but the modal didn't open -- this suggests the `groupedMotors.find()` lookup failed to match.

The likely timing issue: `processedMotors` populates first, the effect fires, but `groupedMotors` (derived via `useGroupedMotors`) may not yet contain the motor when the effect runs. The effect depends on both `processedMotors` and `groupedMotors`, but the `setTimeout(150ms)` may not be enough.

**Fix:** Make the deep-link effect more resilient:
- Add `groupedMotors` to the dependency check more carefully
- If the group lookup fails, fall back to directly finding the motor in `processedMotors` and constructing a temporary group
- Add a retry mechanism if motors haven't loaded yet

### Bug 3: `MotorRedirect.tsx` can't resolve bad slugs

**Root cause:** When the slug `6mh-fourstroke` arrives, `MotorRedirect` converts it to `6MH_FOURSTROKE` and queries `model_key = '6MH_FOURSTROKE'`. The actual key is `FS_6_MH`, so both exact and fuzzy (`ILIKE '%6MH_FOURSTROKE%'`) lookups fail. The user gets a "not found" error.

**Fix:** Add a secondary lookup in `MotorRedirect.tsx` that also tries matching against `model_display` (case-insensitive, with dashes converted to spaces). So `6mh-fourstroke` becomes `6MH FOURSTROKE`, which would match `model_display = '6MH FourStroke'` via `ILIKE`. This ensures old/bad links still work even after the slug generation is fixed.

### Files Changed

1. **`src/pages/quote/MotorSelectionPage.tsx`**
   - Add `model_key: dbMotor.model_key || null` to the motor conversion (line ~530)
   - Make the deep-link `useEffect` (line 706) more resilient with a fallback lookup

2. **`src/pages/MotorRedirect.tsx`**
   - Add fallback query matching `model_display` when `model_key` lookup fails
   - This ensures backwards compatibility with previously generated broken slugs

### Result
- New share links will use the correct `model_key` slug (e.g., `/motors/fs-6-mh`)
- Old broken links (e.g., `/motors/6mh-fourstroke`) will still resolve via `model_display` fallback
- The configurator modal will reliably open when arriving via a share link

