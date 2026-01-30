

# Fix Inventory Source Tracking in Google Sheets Sync

## Problem

The sync function updates stock levels correctly but **never updates the `inventory_source` field**, leaving it as `'html'` (from the old deprecated scraper). This makes it impossible to verify where inventory data originated.

## Current Status

| Metric | Value | Status |
|--------|-------|--------|
| Unique motors in stock | 18 | ✅ Correct |
| Total units | 30 | ✅ Matches sync log |
| Unmatched motors | 0 | ✅ All matched |
| `inventory_source` field | `'html'` | ❌ Should be `'google_sheets'` |

**Good news:** Your current inventory is accurate - no phantom "in stock" motors exist.

---

## Solution

Update the edge function to set `inventory_source: 'google_sheets'` when updating motors.

### File: `supabase/functions/sync-google-sheets-inventory/index.ts`

**Line 327-335 - Current code:**
```typescript
const { error: updateError } = await supabase
  .from('motor_models')
  .update({
    in_stock: true,
    availability: 'In Stock',
    stock_quantity: newQuantity,
    last_stock_check: new Date().toISOString(),
  })
  .eq('id', motor.id);
```

**Updated code:**
```typescript
const { error: updateError } = await supabase
  .from('motor_models')
  .update({
    in_stock: true,
    availability: 'In Stock',
    stock_quantity: newQuantity,
    last_stock_check: new Date().toISOString(),
    inventory_source: 'google_sheets',  // Track data source
  })
  .eq('id', motor.id);
```

---

## What This Fixes

| Before | After |
|--------|-------|
| `inventory_source: 'html'` (confusing/outdated) | `inventory_source: 'google_sheets'` (accurate) |
| Can't tell when sync last ran by looking at motors | Clear audit trail of sync source |

---

## Inventory Verification Results

Your current in-stock motors (all correctly synced from Google Sheet):

| Motor | Qty | HP |
|-------|-----|-----|
| 2.5MH FourStroke | 1 | 2.5 |
| 6MH FourStroke | 1 | 6 |
| 9.9MH FourStroke | 3 | 9.9 |
| 9.9MLH Command Thrust FourStroke | 1 | 9.9 |
| 20 ELH FourStroke | 2 | 20 |
| 20EPT FourStroke | 2 | 20 |
| 25 ELH FourStroke | 1 | 25 |
| 25 ELPT FourStroke | 1 | 25 |
| 40 ELPT FourStroke | 2 | 40 |
| 60 ELPT Command Thrust FourStroke | 2 | 60 |
| 60 ELPT FourStroke | 2 | 60 |
| 90 ELPT FourStroke | 3 | 90 |
| 115 ELPT ProXS | 1 | 115 |
| 115 EXLPT ProXS | 1 | 115 |
| 115ELPT Command Thrust FourStroke | 3 | 115 |
| 150 XL ProXS | 2 | 150 |
| 200 XL ProXS | 1 | 200 |
| 250 L ProXS | 1 | 250 |

**Total: 30 units across 18 configurations** - matches the Google Sheet exactly.

---

## Deployment

After the fix, the `sync-google-sheets-inventory` edge function will be redeployed, and the next sync (manual or 6 AM cron) will update all inventory sources correctly.

