
# Fix Voice Agent's Rebate Matrix Formatting

## Problem

The voice agent gave you wrong promo info because the **rebate matrix is not being formatted correctly** in the ElevenLabs system prompt.

The database stores rebate tiers with:
- `hp_min`, `hp_max` (e.g., 8-20)
- `rebate` (e.g., 250)

But the voice agent prompt uses:
- `tier.hp` ❌ (doesn't exist → undefined)
- `tier.amount` ❌ (doesn't exist → undefined)

This means the voice agent sees **blank rebate data** and makes up incorrect amounts.

---

## Root Cause Comparison

| Agent | Field Names | Result |
|-------|-------------|--------|
| **Text Chatbot** ✅ | `tier.hp_min`, `tier.hp_max`, `tier.rebate` | Correct: "$250 for 8-20HP" |
| **Voice Agent** ❌ | `tier.hp`, `tier.amount` | Broken: "undefined: $undefined" |

---

## Solution

Update `supabase/functions/elevenlabs-conversation-token/index.ts` line 150-156 to match the correct field names used in the text chatbot.

### Before (Broken)
```typescript
// Rebate matrix detail
if (option.matrix && Array.isArray(option.matrix)) {
  formatted += `   FACTORY REBATE BY HORSEPOWER:\n`;
  option.matrix.forEach((tier: any) => {
    formatted += `   - ${tier.hp}: $${tier.amount} cash back\n`;
  });
}
```

### After (Fixed)
```typescript
// Rebate matrix detail - uses hp_min, hp_max, rebate fields
if (option.matrix && Array.isArray(option.matrix)) {
  formatted += `   FACTORY REBATE BY HORSEPOWER:\n`;
  option.matrix.forEach((tier: any) => {
    const hpRange = tier.hp_min === tier.hp_max 
      ? `${tier.hp_min}HP` 
      : `${tier.hp_min}-${tier.hp_max}HP`;
    formatted += `   - ${hpRange}: $${tier.rebate} cash back\n`;
  });
}
```

---

## What This Fixes

After the fix, the voice agent's prompt will correctly show:
```
FACTORY REBATE BY HORSEPOWER:
- 2.5-6HP: $100 cash back
- 8-20HP: $250 cash back
- 25HP: $300 cash back
- 30-60HP: $350 cash back
- 65-75HP: $400 cash back
- 80-115HP: $500 cash back
- 150-200HP: $650 cash back
- 225-425HP: $1000 cash back
```

---

## Technical Details

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Fix rebate matrix formatting (lines 150-156) to use correct database field names |

After the fix, the edge function will need to be redeployed.
