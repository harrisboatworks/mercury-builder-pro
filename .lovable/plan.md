
# Fix: Battery Not Showing on Quote Summary

## Problem Identified

The `QuoteSummaryPage.tsx` uses an **inconsistent method** to detect electric start motors compared to the `OptionsPage.tsx`:

| Component | Detection Method | Issue |
|-----------|------------------|-------|
| `OptionsPage.tsx` | `hasElectricStart(model)` utility | ✅ Correct - uses robust parser |
| `QuoteSummaryPage.tsx` | `motorModel.includes('MH')` | ❌ Wrong - checks for manual start string |

The condition on line 363 checks `!isManualStart && state.looseMotorBattery?.wantsBattery`, but `isManualStart` (line 212) uses a simple string check that may not match all manual-start models.

## Solution

Replace the inconsistent manual-start detection in `QuoteSummaryPage.tsx` with the proper `hasElectricStart` utility that's already used in `OptionsPage.tsx`.

---

## File to Modify

| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Import and use `hasElectricStart` utility |

---

## Code Changes

### Line 62: Add Import

Add to imports:
```typescript
import { hasElectricStart } from '@/lib/motor-config-utils';
```

### Line 212: Replace Detection Logic

**Current:**
```typescript
const isManualStart = motorModel.includes('MH') || motorModel.includes('MLH');
```

**Replace with:**
```typescript
const isElectricStart = hasElectricStart(motorModel);
```

### Line 231: Update Battery Cost Logic

**Current:**
```typescript
const batteryCost = !isManualStart ? 179.99 : 0;
```

**Replace with:**
```typescript
const batteryCost = isElectricStart ? 179.99 : 0;
```

### Line 363: Update Battery Breakdown Condition

**Current:**
```typescript
if (!isManualStart && state.looseMotorBattery?.wantsBattery) {
```

**Replace with:**
```typescript
if (isElectricStart && state.looseMotorBattery?.wantsBattery) {
```

---

## Why This Fixes It

The `hasElectricStart()` utility properly parses Mercury model codes:
- `9.9EH FourStroke` → **E** detected → electric start ✅
- `9.9MH FourStroke` → **M** detected → manual start
- `60 FourStroke` → 40+ HP → defaults to electric ✅

Using the same utility across both pages ensures the battery prompt and summary are **in sync**.

---

## Expected Result

| Scenario | Before | After |
|----------|--------|-------|
| 9.9EH + Battery selected | Battery not shown ❌ | Battery shown as line item ✅ |
| 60HP + Battery selected | Battery not shown ❌ | Battery shown as line item ✅ |
| 9.9MH (manual) | N/A | No battery prompt (correct) |
