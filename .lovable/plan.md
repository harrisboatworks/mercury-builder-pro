
# Fix: Correct Fuel Tank Description for Tiller Motors by HP Range

## Problem
On the Purchase Path page, the "Loose Motor" card incorrectly displays **"Includes propeller & internal fuel tank"** for all tiller motors. However, only motors **≤6HP** have an internal (built-in) fuel tank. Your 9.9EH is an 8-20HP tiller, which includes a **12L external fuel tank**, not an internal one.

## Business Rules (from motor-helpers.ts)

| HP Range | Tiller | Included Tank |
|----------|--------|---------------|
| ≤6HP | All | **Internal** fuel tank (built-in) |
| 8-20HP | Yes | **12L external** fuel tank + hose |
| 25-30HP | Yes | **25L external** fuel tank + hose |
| 25-30HP | No (remote/ProKicker) | None included |
| >30HP | Any | None included |

## Solution

Update the conditional logic in `PurchasePath.tsx` to differentiate between:
1. **≤6HP tillers**: "Includes propeller & internal fuel tank"
2. **8-20HP tillers**: "Includes propeller & 12L fuel tank" 
3. **25-30HP tillers**: "Includes propeller & 25L fuel tank"
4. **9.9-20HP remote**: "Includes 12L fuel tank & hose" (already handled)
5. **Other**: "Ready for rigging & accessories"

---

## File to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/PurchasePath.tsx` | Add HP-based conditionals for tiller fuel tank descriptions |

---

## Code Changes

### Add HP range flags (after line 19)

```typescript
const hp = typeof selectedMotor?.hp === 'string' ? parseInt(selectedMotor.hp, 10) : selectedMotor?.hp;
const isTiller = isTillerMotor(selectedMotor?.model || '');
const isInStock = selectedMotor?.stockStatus === 'In Stock';

// Fuel tank logic based on HP
const hasInternalTank = hp && hp <= 6;  // Only ≤6HP have internal tanks
const includes12LTank = hp && hp >= 8 && hp <= 20;  // 8-20HP (both tiller & remote)
const includes25LTank = hp && hp >= 25 && hp <= 30 && isTiller;  // 25-30HP tiller only
```

### Update the conditional display (lines 87-102)

Replace the current simplified check with proper HP-based logic:

```typescript
{isTiller && hasInternalTank ? (
  <div className="flex flex-row items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <span className="text-left">Includes propeller & internal fuel tank</span>
  </div>
) : isTiller && includes12LTank ? (
  <div className="flex flex-row items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <span className="text-left">Includes propeller & 12L fuel tank</span>
  </div>
) : isTiller && includes25LTank ? (
  <div className="flex flex-row items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <span className="text-left">Includes propeller & 25L fuel tank</span>
  </div>
) : includes12LTank && !isTiller ? (
  <div className="flex flex-row items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <span className="text-left">Includes 12L fuel tank & hose</span>
  </div>
) : (
  <div className="flex flex-row items-start gap-3">
    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
    <span className="text-left">Includes propeller</span>
  </div>
)}
```

---

## Result

| Motor | Before | After |
|-------|--------|-------|
| 4HP Tiller | "propeller & internal fuel tank" | "propeller & internal fuel tank" ✓ |
| 6HP Tiller | "propeller & internal fuel tank" | "propeller & internal fuel tank" ✓ |
| **9.9EH Tiller** | "propeller & internal fuel tank" ❌ | "propeller & 12L fuel tank" ✓ |
| 15HP Tiller | "propeller & internal fuel tank" ❌ | "propeller & 12L fuel tank" ✓ |
| 25HP Tiller | "propeller & internal fuel tank" ❌ | "propeller & 25L fuel tank" ✓ |
| 15HP Remote | "12L fuel tank & hose" | "12L fuel tank & hose" ✓ |
| 60HP Remote | "Ready for rigging..." | "Includes propeller" ✓ |
