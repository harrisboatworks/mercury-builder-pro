

# Fix: Auto-Detect Engine Type from Trade-In Model Field

## Problem
The agent created this quote describing a "2015 Mercury 150HP 2-stroke trade-in, high hours (poor condition)" but **didn't pass `engine_type: "2-stroke"` or `engine_hours`** in the `create_quote` request. The trade-in model field is literally `"2-Stroke"` but the code defaults `engine_type` to `"4-stroke"`, resulting in a **$3,300 estimate instead of ~$2,225** (a $1,075 overstatement).

The docs and code are correct — this is an agent behavior gap. But we can add a safety net.

## Changes

### `supabase/functions/agent-quote-api/index.ts`

**Add auto-detection in both `estimateTradeIn` and `create_quote` trade-in blocks:**

Before calling `runTradeEstimate`, if `engine_type` is not explicitly provided (or is the default "4-stroke"), check the `model` field for 2-stroke indicators:

```typescript
// Auto-detect engine type from model field if not explicitly set
let effectiveEngineType = ti.engine_type;
if (!effectiveEngineType || effectiveEngineType === "4-stroke") {
  const modelLower = (ti.model || "").toLowerCase();
  if (modelLower.includes("2-stroke") || modelLower.includes("2 stroke") || modelLower.includes("two stroke")) {
    effectiveEngineType = "2-stroke";
  } else if (modelLower.includes("optimax")) {
    effectiveEngineType = "optimax";
  }
}
```

Apply this in 3 locations:
1. `estimateTradeIn` action (~line 495) — for standalone trade estimates
2. `create_quote` trade-in block (~line 821) — when creating quotes
3. `update_quote` trade-in block — when updating quotes

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/agent-quote-api/index.ts` | Add engine_type auto-detection from model field in 3 trade-in call sites |

