

# Standardize Pro XS Model Codes to Full Format

## The Goal

Normalize all Pro XS motors to use full rigging codes for consistency:
- `L` → `ELPT` (Electric, Long shaft, Power Trim)
- `XL` → `EXLPT` (Electric, Extra Long shaft, Power Trim)

## Current State in Database

| HP | Current Format | Should Be |
|----|----------------|-----------|
| 115 | 115 ELPT ProXS | 115 ELPT ProXS (already correct) |
| 115 | 115 EXLPT ProXS | 115 EXLPT ProXS (already correct) |
| 150 | 150 L ProXS | 150 ELPT ProXS |
| 150 | 150 XL ProXS | 150 EXLPT ProXS |
| 175 | 175 L ProXS | 175 ELPT ProXS |
| 175 | 175 XL ProXS | 175 EXLPT ProXS |
| 200 | 200 L ProXS | 200 ELPT ProXS |
| 200 | 200 XL ProXS | 200 EXLPT ProXS |
| 225 | 225 L ProXS | 225 ELPT ProXS |
| 225 | 225 XL ProXS | 225 EXLPT ProXS |
| 250 | 250 L ProXS | 250 ELPT ProXS |
| 250 | 250 XL ProXS | 250 EXLPT ProXS |
| 300 | 300L Pro XS DTS TorqueMaster | 300 ELPT Pro XS DTS TorqueMaster |
| 300 | 300XL Pro XS | 300 EXLPT Pro XS |
| 300 | 300XL Pro XS DTS | 300 EXLPT Pro XS DTS |
| 300 | 300CXL Pro XS DTS | 300 CEXLPT Pro XS DTS (Counter-rotating) |

## Implementation Plan

### Step 1: Update Database Model Names

Run a SQL migration to rename all Pro XS motors to use full rigging codes:

```sql
-- Standardize Pro XS model_display to full rigging codes
UPDATE motor_models
SET model_display = REPLACE(model_display, ' L ProXS', ' ELPT ProXS')
WHERE model_display LIKE '% L ProXS';

UPDATE motor_models
SET model_display = REPLACE(model_display, ' XL ProXS', ' EXLPT ProXS')
WHERE model_display LIKE '% XL ProXS';

-- Handle 300 HP variants with different spacing
UPDATE motor_models
SET model_display = REGEXP_REPLACE(model_display, '(\d+)L Pro XS', '\1 ELPT Pro XS')
WHERE model_display ~ '^\d+L Pro XS';

UPDATE motor_models
SET model_display = REGEXP_REPLACE(model_display, '(\d+)XL Pro XS', '\1 EXLPT Pro XS')
WHERE model_display ~ '^\d+XL Pro XS';

-- Counter-rotating: CXL → CEXLPT
UPDATE motor_models
SET model_display = REGEXP_REPLACE(model_display, '(\d+)CXL Pro XS', '\1 CEXLPT Pro XS')
WHERE model_display ~ '^\d+CXL Pro XS';
```

### Step 2: Update Sync Function to Translate Codes

Modify `supabase/functions/sync-google-sheets-inventory/index.ts` to translate sheet entries:

```typescript
// In parseMotorName function, after detecting riggingCode:
let riggingCode = riggingMatch ? riggingMatch[1].toUpperCase() : null;

// For Pro XS motors, translate L/XL to full codes for matching
if (riggingCode && (family === 'ProXS' || /pro\s*xs/i.test(normalized))) {
  if (riggingCode === 'L') {
    riggingCode = 'ELPT';
    console.log(`  Pro XS translation: L → ELPT`);
  } else if (riggingCode === 'XL') {
    riggingCode = 'EXLPT';
    console.log(`  Pro XS translation: XL → EXLPT`);
  }
}
```

### Step 3: Update Rigging Code Regex Priority

Ensure `L` and `XL` are matched correctly (they currently are, but ensure they don't get eaten by longer codes for non-Pro XS):

The current regex already handles this correctly since `ELPT` and `EXLPT` come before `L` and `XL` in the pattern.

## Files to Modify

| Location | Change |
|----------|--------|
| Database (SQL) | Update `model_display` for Pro XS motors 150HP+ |
| `supabase/functions/sync-google-sheets-inventory/index.ts` | Add L→ELPT, XL→EXLPT translation for Pro XS |

## Result

After this change:
- All Pro XS motors display with clear, full rigging codes
- Google Sheet entries like "Pro XS 200 HP L" will correctly match "200 ELPT ProXS"
- Consistent naming across all motor families

