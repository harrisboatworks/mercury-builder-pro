

## Fix Share Link Still Using Wrong Slug

### Root Cause
The `Motor` interface in `QuoteBuilder.tsx` doesn't include `model_key`, so even though the database query fetches it, the data gets lost when passed around as the `Motor` type. The ShareLinkButton falls back to `motor.model` ("6MH FourStroke"), producing `6mh-fourstroke` instead of the correct `fs-6-mh`.

### Fixes

**1. `src/components/QuoteBuilder.tsx`** -- Add `model_key` to the Motor interface
- Add `model_key?: string | null;` to the `Motor` interface so it flows cleanly through the type system without `as any` hacks

**2. `src/components/quote-builder/MotorSelection.tsx`** -- Remove the `as any` cast
- In the motor mapping (~line 489), set `model_key: m.model_key || null` as a proper typed field instead of relying on `as any`

**3. `src/components/motors/MotorCardPreview.tsx`** -- Remove `(motor as any)` cast
- Change `(motor as any).model_key` to just `motor.model_key` since the Motor type will now include it

These are small, targeted changes -- just making `model_key` a first-class field on the Motor type so the ShareLinkButton always gets it.
