

## Findings

The `realtime-session` edge function (OpenAI Realtime API voice assistant) has no dedicated promotional section at all. Key issues:

1. **Line 127**: References "factory cash rebate" for sub-$5k motors but provides zero context about what promotion is active, rebate amounts, or the Get 7 structure
2. **No promo section**: Unlike the ai-chatbot (which now has explicit "PROMOTIONAL RESPONSE PATTERNS"), this voice prompt has nothing — if asked about rebates/promos, the AI would guess or deflect

The ElevenLabs voice assistant (`useElevenLabsVoice.ts`) is fine — it uses a `check_current_deals` client tool that queries the database live. No changes needed there.

## Plan

**Single file edit**: `supabase/functions/realtime-session/index.ts`

Add a `PROMOTIONS` section before the closing of the instructions string (before line 129), matching the corrected ai-chatbot patterns but condensed for voice brevity:

```
CURRENT PROMOTION — GET 7 (Jan 12 – Mar 31, 2026):
- 7-year factory warranty on ALL Mercury outboards (3 standard + 4 bonus)
- Customer picks ONE bonus: 6 Months No Payments, Special Financing (from 2.99%), OR Factory Cash Rebate
- Rebate amounts by HP: 2.5-6HP = $100, 8-15HP = $250, 20-30HP = $350, 40-60HP = $500, 75-115HP = $600, 150HP = $750, 175-300HP = $850, 350-400HP = $1,000
- NEVER say "no rebates" — every HP range qualifies
- Direct them to the quote builder or /promotions for full details
```

Also update line 127 to reference the Get 7 rebate explicitly instead of the generic "factory cash rebate" mention.

Redeploy the `realtime-session` edge function after editing.

