

## Fix: Google Sheets Inventory Sync Wiping Motor Exclusions

### What's Happening

You correctly excluded certain motors by marking them as `availability = 'Exclude'` in the admin dashboard. However, every time the **Google Sheets inventory sync** runs, it resets **every motor's** `availability` field to `null` before updating stock. This erases all your exclusion settings.

Currently, **zero motors** in the database are marked as `Exclude` -- they've all been wiped.

### Root Cause

In `supabase/functions/sync-google-sheets-inventory/index.ts` (line 164-172), the sync does:

```
-- Reset ALL motors (no exceptions)
UPDATE motor_models SET availability = NULL, in_stock = false, stock_quantity = 0
```

This blanket reset doesn't preserve the `Exclude` status.

### Fix

**File: `supabase/functions/sync-google-sheets-inventory/index.ts`**

1. Change the reset query to **skip motors marked as 'Exclude'** by adding `.neq('availability', 'Exclude')` to the reset update. This way excluded motors keep their status and are never shown to customers.

2. Also add the same guard to the stock update section so that an excluded motor can't accidentally get set back to `'In Stock'` if it appears in the Google Sheet.

### After Fix

1. Deploy the updated edge function
2. You'll need to re-exclude the motors that were reset -- go to the Admin Inventory Dashboard and mark those models as `Exclude` again
3. Future inventory syncs will preserve those exclusions

### Files Changed
1. **`supabase/functions/sync-google-sheets-inventory/index.ts`** -- Add `.neq('availability', 'Exclude')` to the bulk reset query, and skip excluded motors during stock updates
