
# Fix Model Code Breakdown Missing Electric Start

## Problem

The PDF quote's "Motor Code Breakdown" section is not showing "Electric start" for the motor **"60 ELPT FourStroke"**.

**Current PDF shows:**
- 60 = 60 Horsepower
- Standard 20" shaft
- PT = Power Trim & Tilt

**Should also show:**
- E = Electric start
- L = Long shaft (20")

---

## Root Cause

The regex that extracts the model code fails when there's a **space** between the HP and rig codes.

**Current regex (line 477):**
```javascript
const codeMatch = productName.match(/^([\d.]+[A-Z]*)/i);
```

| Input | What it captures | Result |
|-------|------------------|--------|
| `"60ELPT FourStroke"` | `"60ELPT"` | Works |
| `"60 ELPT FourStroke"` | `"60"` | **Broken** - space stops the match |

Since `modelCode = "60"` doesn't contain 'E', 'L', etc., those codes are not displayed.

---

## Solution

Update the regex to capture the rig codes even when separated by a space:

**New regex:**
```javascript
const codeMatch = productName.match(/^([\d.]+)\s*([A-Z]+)?/i);
const modelCode = codeMatch ? (codeMatch[1] + (codeMatch[2] || '')).toUpperCase() : '';
```

This matches:
- `[\d.]+` - The horsepower number
- `\s*` - Optional whitespace
- `([A-Z]+)?` - Optional letter codes (ELPT, MH, etc.)

Then combines them: `"60" + "ELPT"` = `"60ELPT"`

---

## Technical Changes

**File: `src/components/quote-pdf/ProfessionalQuotePDF.tsx`**

Update lines 476-478:

```typescript
// Before (broken with spaces):
const codeMatch = productName.match(/^([\d.]+[A-Z]*)/i);
const modelCode = codeMatch ? codeMatch[1].toUpperCase() : '';

// After (handles spaces):
const codeMatch = productName.match(/^([\d.]+)\s*([A-Z]+)?/i);
const modelCode = codeMatch ? (codeMatch[1] + (codeMatch[2] || '')).toUpperCase() : '';
```

---

## Expected Result After Fix

**Motor Code Breakdown for "60 ELPT FourStroke":**
- 60 = 60 Horsepower
- **E = Electric start** ✓
- **L = Long shaft (20")** ✓
- PT = Power Trim & Tilt

---

## Files to Modify

1. **`src/components/quote-pdf/ProfessionalQuotePDF.tsx`** — Fix regex on lines 477-478 to handle space-separated rig codes
