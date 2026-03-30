

# Fix Google Sheets Sync CT Matching Ambiguity

## Problem
The sync function matches motors by HP + rigging code + family with `limit(1)`. Now that CT variants exist for 40, 50, and 90 HP, a non-CT motor from the sheet (e.g., "90 ELPT FourStroke") could incorrectly match the CT variant ("90 ELPT Command Thrust FourStroke") since both contain "ELPT" and "FourStroke".

The sync already adds a CT filter when `hasCommandThrust` is true, but does NOT exclude CT models when `hasCommandThrust` is false.

## Current in-stock status (verified correct)
28/28 matched, 0 unmatched. 16 unique models in stock with correct quantities. All good until the next sync runs with the new CT models in the database.

## Fix
In `supabase/functions/sync-google-sheets-inventory/index.ts`, add a negative CT filter when the parsed motor does NOT have Command Thrust:

After the existing CT check block (~line 272), add:
```typescript
// If NOT a Command Thrust motor, explicitly EXCLUDE CT models to prevent false matches
if (!parsed.hasCommandThrust) {
  query = query.not('model_display', 'ilike', '%Command Thrust%');
}
```

Apply the same fix to the fallback query (~line 305).

## Files Changed
| File | Change |
|------|--------|
| `supabase/functions/sync-google-sheets-inventory/index.ts` | Add negative CT filter for non-CT motors in both primary and fallback queries |

