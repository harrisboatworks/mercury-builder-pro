

# Fix: Revert ProKicker Blanket Tiller Detection

## Problem

The recent change incorrectly marked ALL ProKicker motors as tillers:

```typescript
// This is WRONG - not all ProKickers are tillers!
if (upperModel.includes('PROKICKER') || upperModel.includes('PRO KICKER')) {
  tillerCache.set(model, true);
  return true;
}
```

**Reality from the pricing data:**

| Model Code | Tiller? | Why |
|------------|---------|-----|
| 15**EL**HPT ProKicker | Yes | Has "H" in code |
| 15**EXL**HPT ProKicker | Yes | Has "H" in code |  
| 15**EL**PT ProKicker | No | No "H" - remote steering |
| 15**EX**LPT ProKicker | No | No "H" - remote steering |
| 25ELPT ProKicker | No | No "H" - remote steering |
| 25EXLPT ProKicker | No | No "H" - remote steering |

The **"H"** in the rigging code still correctly identifies tillers. ProKicker is just a designation indicating these motors are designed as kicker/trolling motors - it doesn't determine the steering type.

---

## Solution

**Remove the blanket ProKicker detection** from `isTillerMotor()`. The existing "H" pattern matching already handles this correctly:

```typescript
const tillerPatterns = [
  /\b(\d+\.?\d*)\s*MLH\b/i,    // MLH = Manual + Long + Handle  
  /\b(\d+\.?\d*)\s*ELH\b/i,    // ELH = Electric + Long + Handle
  /\b(\d+\.?\d*)\s*EXLH\b/i,   // EXLH = Electric + XL + Handle
  /\b(\d+\.?\d*)\s*ELHPT\b/i,  // ELHPT = Electric + Long + Handle + Power Tilt
  /\b(\d+\.?\d*)\s*EXLHPT\b/i, // EXLHPT = Electric + XL + Handle + Power Tilt
  // ... more H patterns
];
```

These patterns will correctly match:
- "15ELHPT ProKicker" (tiller) via `ELHPT` pattern
- "9.9 EXLHPT ProKicker" (tiller) via `EXLHPT` pattern

And correctly NOT match:
- "15EXLPT ProKicker" (remote) - no H
- "25ELPT ProKicker" (remote) - no H

---

## Technical Change

**File: `src/lib/motor-helpers.ts`**

Remove lines 463-467:
```typescript
// DELETE THIS BLOCK:
// ProKicker motors are tiller/kicker style (even without H suffix)
if (upperModel.includes('PROKICKER') || upperModel.includes('PRO KICKER')) {
  tillerCache.set(model, true);
  return true;
}
```

The existing `tillerPatterns` array already handles "H" detection correctly for all motors, including ProKickers.

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/motor-helpers.ts` | Remove incorrect ProKicker blanket tiller detection (lines 463-467) |

---

## Testing Checklist

After this fix:

1. **15EXLPT ProKicker** (no H) should be detected as **REMOTE** - battery prompt should NOT appear
2. **15ELHPT ProKicker** (has H) should be detected as **TILLER** - battery prompt SHOULD appear  
3. **25EXLPT ProKicker** (no H) should be detected as **REMOTE**
4. **9.9 EXLHPT ProKicker** (has H) should be detected as **TILLER**

