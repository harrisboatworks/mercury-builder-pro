

## Problem

The AI chatbot incorrectly tells users "there are no rebates" for 9.9HP motors, despite the Get 7 promotion being active and the rebate matrix data being injected into the system prompt. The quote builder correctly shows a $250 rebate for the same motor.

## Root Cause

The system prompt in `supabase/functions/ai-chatbot/index.ts` (lines 628-646) has outdated "PROMOTIONAL RESPONSE PATTERNS" that mislead the AI:

1. References obsolete promo name "Get 5" instead of current "Get 7"
2. Has a "When No Special Promos Active" fallback section that the AI incorrectly triggers
3. Mentions "0% Financing Promos" which aren't the current offer structure
4. Lacks an explicit instruction to **always consult the injected promotion data** before answering rebate/promo questions
5. No instruction telling the AI that the Get 7 rebate applies to ALL HP ranges (the matrix covers every tier)

## Fix

Rewrite lines 628-646 in `supabase/functions/ai-chatbot/index.ts` to replace the outdated promotional response patterns with accurate instructions:

**Replace the entire "PROMOTIONAL RESPONSE PATTERNS" section with:**

```
## PROMOTIONAL RESPONSE PATTERNS (CRITICAL — READ CAREFULLY):

### Before Answering ANY Promotion/Rebate Question:
- ALWAYS check the "CURRENT PROMOTIONS & SPECIAL OFFERS" section above — it contains LIVE data from the database
- If a rebate matrix is listed, look up the customer's HP range to give the exact rebate amount
- NEVER say "no rebates available" if the promotion data above shows an active promotion with a rebate matrix
- The current "Get 7" promotion applies to ALL Mercury outboards — every HP range has a rebate tier

### When Discussing the Get 7 Promotion:
- 7-year factory warranty (3 standard + 4 bonus years) on ALL qualifying Mercury outboards
- Customer chooses ONE bonus: No Payments for 6 Months, Special Financing, OR Factory Cash Rebate
- Rebate amounts vary by HP — check the matrix above for exact dollar amounts
- Direct to /promotions for full details or the quote builder to see it applied

### Rebate Questions:
- Look up the HP in the rebate matrix from the promotion data above
- Give the exact dollar amount: "The 9.9HP qualifies for a $[amount] factory rebate"
- Mention it's one of three bonus choices they can pick from
- NEVER say rebates don't exist if the matrix data is present above

### When No Promotions Are In Database:
- "Our everyday pricing is competitive with any Mercury dealer"
- Focus on value: warranty, service, local support
```

This is a single edge function file edit (~20 lines replaced). After editing, the function must be redeployed.

