

# Fix: AI Chat Sending Users to Mercury Website for Promo Questions

## Problem Analysis

When users ask about the "Get 7" promotion, the AI chatbot:

1. Says the info is correct (7-year warranty, etc.)
2. **BUT** adds: "these promotional offers can vary by region and dealer, so for the most accurate and up-to-date details, it's best to check Mercury's official website or give us a call"
3. This is wrong because Harris has a dedicated `/promotions` page with all details including:
   - Complete promo structure (7 years + Choose One)
   - Exact rebate amounts by HP
   - Financing rates
   - End date (March 31, 2026)

### Root Cause

The `searchWithPerplexity` function is configured to search `mercurymarine.com` for promotion queries (lines 614-619). This returns **generic national** promo info with the typical "varies by dealer" disclaimer, which the AI then incorporates into its response despite having authoritative local data.

```text
Current flow:
User asks about Get 7 → Category: "promotions" → Perplexity searches mercurymarine.com
→ Returns: "offers vary by region and dealer" → AI repeats this hedge
```

---

## Solution

### 1. Skip Perplexity for Promotion Queries

The local database already has complete, authoritative promo data. There's no need to search externally.

### 2. Strengthen the Promotion Response Instructions

Add explicit instructions telling the AI:
- Use ONLY the local promo data provided in context
- Never say "check Mercury website" for promotions
- Always link to `/promotions` as the authoritative source
- Include specific details (end date, rebate amounts, etc.)

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/ai-chatbot-stream/index.ts` | Skip Perplexity for `promotions` category; strengthen promo response rules |

---

## Code Changes

### Change 1: Skip Perplexity for Promotions (Line ~562)

**Current:**
```typescript
// Skip Perplexity for redirect categories and none
if (category === 'none' || category === 'financing' || category === 'tradein_redirect') return null;
```

**Replace with:**
```typescript
// Skip Perplexity for redirect categories, none, and promotions (we have authoritative local data)
if (category === 'none' || category === 'financing' || category === 'tradein_redirect' || category === 'promotions') return null;
```

### Change 2: Strengthen Promotion Instructions (Lines ~1493-1500)

**Current:**
```typescript
## CURRENT PROMOTIONS - ALWAYS LINK!
${promoSummary || 'Ask about current offers'}

When mentioning ANY promotion:
- ALWAYS include a link: [See all promos](/promotions) or [Check out the details](/promotions)
- Mention the end date to create urgency
- Explain what the customer gets (warranty extension, $ off, etc.)
- Example: "The Mercury Get 5 Promo gets you +2 years extended warranty FREE! Ends Feb 8th. [Check out the details](/promotions)"
```

**Replace with:**
```typescript
## CURRENT PROMOTIONS - YOU HAVE AUTHORITATIVE DATA!
${promoSummary || 'Ask about current offers'}

**CRITICAL PROMOTION RULES:**
- You have COMPLETE, ACCURATE promo data above - use it confidently!
- NEVER say "check Mercury's website" or "varies by region/dealer" - WE ARE THE DEALER
- NEVER suggest calling for promo details - you have all the info
- ALWAYS link to [our promotions page](/promotions) - it has full details
- Mention the end date to create urgency
- If they're viewing a motor, tell them the EXACT rebate amount for that HP

**Example responses:**
- "The Get 7 deal gets you 7 years warranty PLUS your choice of a rebate, special financing, or 6 months no payments. Ends March 31st. [Check out all the options](/promotions)"
- "That 60HP qualifies for a $300 factory rebate with the Get 7 promo! Or you can choose 2.99% financing instead. [See the details](/promotions)"

DO NOT hedge or add disclaimers about contacting Mercury. Our /promotions page is the source of truth for this dealership.
```

---

## Expected Behavior After Fix

| Question | Before | After |
|----------|--------|-------|
| "What's the Get 7 deal?" | "Great promotion! ...varies by region and dealer, check Mercury website or call..." | "The Get 7 gets you 7 years warranty plus choose one bonus - rebate, financing, or 6 months no payments. Ends March 31st. [Full details](/promotions)" |
| "Do I get a rebate on the 8ELH?" | "Rebates vary by dealer..." | "Yep! The 8HP qualifies for a $250 factory rebate with the Get 7 promo. [See all options](/promotions)" |

---

## Why This Works

1. **No external search pollution**: Perplexity won't inject "varies by dealer" disclaimers
2. **Authoritative local data**: The AI uses the promo details already in the database
3. **Clear directive**: Explicit instruction to NEVER redirect to Mercury website
4. **Better UX**: Users get complete, confident answers with a link to learn more

---

## Technical Notes

The promo data flows from:
1. `promotions` table → `promo_options` JSONB field with rebate matrix
2. `buildSystemPrompt()` fetches active promos (line ~779)
3. `promoSummary` and `rebateMatrixContext` inject details into system prompt
4. This fix ensures the AI uses this data without external interference

