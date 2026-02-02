
# Fix Google Sheets Inventory Sync Mismatches

## Problem Summary

The Google Sheets sync is incorrectly marking motors as "In Stock" due to bugs in the model name parsing logic. Your screenshot shows motors like **25EPT FourStroke** and **20ML FourStroke** displaying as "In Stock Today" when they're not actually in your inventory.

### Verified Mismatches

| What's in Your Google Sheet | What It's Matching To | Correct Motor |
|-----------------------------|----------------------|---------------|
| FourStroke 20HP EFI EH | 20ML FourStroke | 20 EH FourStroke |
| FourStroke 20HP EFI EH | 20EPT FourStroke | 20 EH FourStroke |
| FourStroke 25HP EFI ELHPT | 25EPT FourStroke | 25 ELHPT FourStroke |

### Root Cause

The rigging code regex in the sync function is missing several valid Mercury codes:

**Current regex:**
```
\b(EXLPT|ELHPT|ELPT|ELH|MRC|MXXL|MXL|MLH|MH|XXL|XL|CT)\b
```

**Missing codes:** `EH`, `EPT`, `E`, `EL`, `ML`

When a rigging code isn't recognized, the sync falls back to matching by HP + family only, causing a 20HP FourStroke with code `EH` to match the first 20HP FourStroke found (which happens to be `20ML`).

---

## Implementation Plan

### Step 1: Fix the Rigging Code Regex

Update the regex pattern in `sync-google-sheets-inventory/index.ts` to include all valid Mercury rigging codes:

```typescript
// BEFORE
const riggingMatch = normalized.match(/\b(EXLPT|ELHPT|ELPT|ELH|MRC|MXXL|MXL|MLH|MH|XXL|XL|CT)\b/i);

// AFTER - Ordered by length (longest first) to prevent partial matches
const riggingMatch = normalized.match(/\b(EXLPT|ELHPT|ELPT|ELH|EPT|EH|MRC|MXXL|MXL|MLH|MH|ML|EL|E|XXL|XL|L|CT)\b/i);
```

**Code priorities (longest first):**
- `EXLPT` - Electric, Extra Long, Power Trim
- `ELHPT` - Electric, Long, High-thrust, Power Trim
- `ELPT` - Electric, Long, Power Trim
- `ELH` - Electric, Long, High-thrust (Tiller)
- `EPT` - Electric, Power Trim (Short shaft)
- `EH` - Electric, Short shaft (Tiller)
- `MRC` - Mercury Racing
- `MXXL` - Manual, Ultra-Extra Long
- `MXL` - Manual, Extra Long
- `MLH` - Manual, Long, High-thrust
- `MH` - Manual, Short shaft
- `ML` - Manual, Long
- `EL` - Electric, Long
- `E` - Electric base
- `XXL` - Ultra-Extra Long
- `XL` - Extra Long
- `L` - Long (standalone)
- `CT` - Command Thrust

### Step 2: Prevent False Matches

Add stricter validation to prevent a motor from matching when no rigging code is detected in the sheet entry:

```typescript
// If rigging code was detected in the sheet BUT not found in DB results, skip the match
if (parsed.riggingCode && motors && motors.length > 0) {
  const motor = motors[0];
  // Validate the matched motor contains the same rigging code
  const motorHasCode = motor.model_display.toUpperCase().includes(parsed.riggingCode);
  if (!motorHasCode) {
    console.log(`⚠️ Rigging code mismatch - skipping false match`);
    motors = []; // Clear to prevent false positive
  }
}

// NEW: If NO rigging code was detected, require an EXACT HP-only match
// This prevents "FourStroke 20HP EFI EH" (EH not detected) from matching "20ML"
if (!parsed.riggingCode) {
  console.log(`⚠️ No rigging code detected for "${modelName}" - flagging as unmatched`);
  unmatchedModels.push(modelName);
  continue; // Skip this entry - requires human review
}
```

### Step 3: Add Admin Alert for Unmatched Motors

When motors can't be matched, send an email notification so you can review and either:
- Fix the model name format in Google Sheets
- Add the missing motor to the database

This already exists in the code but will now trigger more often with stricter matching.

### Step 4: Reset Phantom Stock Data

After deploying the fix, manually clear the incorrect stock data:

```sql
-- Reset incorrectly matched motors
UPDATE motor_models 
SET in_stock = false, 
    stock_quantity = 0, 
    availability = NULL
WHERE model_display IN (
  '20ML FourStroke',
  '20EPT FourStroke', 
  '25EPT FourStroke'
)
AND inventory_source = 'google_sheets';
```

Then re-run the sync to get correct matches.

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/sync-google-sheets-inventory/index.ts` | Expand rigging code regex, add stricter validation |

---

## Technical Details

### Updated `parseMotorName` Function

```typescript
function parseMotorName(name: string): {
  hp: number | null;
  riggingCode: string | null;
  family: string | null;
  hasCommandThrust: boolean;
} {
  let normalized = name
    .replace(/®/g, '')
    .replace(/\s*HP\s*/gi, ' ')
    .replace(/\s*EFI\s*/gi, ' ') // Remove EFI to not confuse with rigging
    .replace(/Pro\s*XS/gi, 'ProXS')
    .trim();

  // Extract HP
  const hpMatch = normalized.match(/(\d+(?:\.\d+)?)\s*HP|\b(\d+(?:\.\d+)?)\b/i);
  const hp = hpMatch ? parseFloat(hpMatch[1] || hpMatch[2]) : null;

  // FIXED: Comprehensive rigging codes (longest first for proper matching)
  const riggingMatch = normalized.match(
    /\b(EXLPT|ELHPT|ELPT|ELH|EPT|EH|MRC|MXXL|MXL|MLH|MH|ML|EL|E|XXL|XL|L|CT)\b/i
  );
  const riggingCode = riggingMatch ? riggingMatch[1].toUpperCase() : null;

  // Command Thrust detection
  const hasCommandThrust = /command\s*thrust|\bCT\b/i.test(normalized);

  // Family detection
  let family: string | null = null;
  if (/verado/i.test(normalized)) family = 'Verado';
  else if (/pro\s*xs|proxs/i.test(normalized)) family = 'ProXS';
  else if (/sea\s*pro|seapro/i.test(normalized)) family = 'SeaPro';
  else if (/four\s*stroke|fourstroke/i.test(normalized)) family = 'FourStroke';

  return { hp, riggingCode, family, hasCommandThrust };
}
```

---

## Expected Results After Fix

| Google Sheet Entry | Will Match To | Status |
|--------------------|---------------|--------|
| FourStroke 20HP EFI EH | 20 EH FourStroke | Correct |
| FourStroke 25HP EFI ELHPT | 25 ELHPT FourStroke | Correct |
| 20 ELH | 20 ELH FourStroke | Already correct |
| FourStroke 9.9HP MH | 9.9MH FourStroke | Already correct |

Motors not in your database (like `20 EH FourStroke` if missing) will show as "unmatched" and you'll receive an email alert.

---

## Future Recommendation

Consider updating your Google Sheet to use standardized model codes that exactly match your database format. For example:
- Instead of: `FourStroke 20HP EFI EH`
- Use: `20 EH FourStroke`

This eliminates parsing ambiguity entirely.
