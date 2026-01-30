
# Add "Do Not Fabricate" AI Guardrails

## Goal

Prevent chatbot and voice agents from making up facts about ice conditions, booking availability, specific inventory, prices, or service timelines. This protects customer trust and prevents misinformation.

---

## What Guardrails Will Say

Based on the business context document:

### Never Fabricate
- Ice/lake conditions (use weather station data or say nothing)
- Booking availability percentages ("we're 40% booked" — NO)
- Specific inventory unless from database
- Local business recommendations that conflict with our services
- Prices unless from database or current promo
- Service timelines unless confirmed

### Safe to Include
- Facts from knowledge files
- Data from harrisboatworks.ca
- Current weather from weather station link
- Mercury promos from database
- General seasonal advice that's always true

### When in Doubt
Be vague or skip it. "Planning ahead for spring?" is better than "We're almost booked!"

---

## Files to Update

| File | Location | Change |
|------|----------|--------|
| `ai-chatbot-stream/index.ts` | After GOLDEN RULES (line 916) | Add `## DO NOT FABRICATE` section |
| `elevenlabs-conversation-token/index.ts` | After VOICE RULES (line 343) | Add `## DO NOT FABRICATE` section |
| `realtime-session/index.ts` | In AVOID section (line 82) | Add fabrication restrictions |

---

## Proposed Changes

### 1. Chatbot System Prompt (`ai-chatbot-stream/index.ts`)

Insert after GOLDEN RULES section:

```text
## DO NOT FABRICATE (CRITICAL FOR TRUST)
Only state facts you can verify. If you don't have data, don't make it up.

**NEVER fabricate:**
- Ice/lake conditions (use weather station link or say "check our weather station")
- Booking percentages ("we're 40% booked" — NO! say "call to check availability")
- Specific inventory unless from database query
- Prices unless from database, quote builder, or current promo
- Service timelines ("takes about 2 weeks" — NO! say "depends on the season, give us a call")
- Local business recommendations that conflict with our services (we sell ethanol-free fuel!)

**When in doubt:** Be vague or skip it. "Planning ahead for spring?" is better than "We're almost booked!"
```

### 2. Voice Agent Prompt (`elevenlabs-conversation-token/index.ts`)

Insert after VOICE RULES section:

```text
## DO NOT FABRICATE (CRITICAL):
Never make up:
- Ice/lake conditions (say "check our weather station" or nothing)
- Booking percentages ("we're 40% booked" — NO!)
- Prices unless you have them from tools
- Service timelines (say "give us a call to confirm")
- Inventory unless from your check_inventory tool

When unsure: Be vague. "Call us to check" beats making it up.
```

### 3. OpenAI Realtime Prompt (`realtime-session/index.ts`)

Add to the AVOID section:

```text
- Fabricating ice/lake conditions, booking percentages, service timelines, or prices you don't have
```

---

## Deployment

After changes:
1. Redeploy `ai-chatbot-stream` edge function
2. Redeploy `elevenlabs-conversation-token` edge function
3. Redeploy `realtime-session` edge function

All three voice/chat systems will then enforce the same fabrication guardrails.
