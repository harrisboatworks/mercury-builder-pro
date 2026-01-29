
# Enhance Voice Agent with Proactive Offers & Lead Capture

## ✅ COMPLETED

### Changes Made

| File | Change | Status |
|------|--------|--------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Added proactive offer instructions to system prompt | ✅ |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Updated navigation tools section with navigate_to_contact | ✅ |
| `supabase/functions/elevenlabs-mcp-server/index.ts` | Added `navigate_to_contact` tool definition to TOOLS array | ✅ |
| `supabase/functions/elevenlabs-mcp-server/index.ts` | Added `navigate_to_contact` case handler in switch statement | ✅ |
| `src/hooks/useElevenLabsVoice.ts` | Added client-side `navigate_to_contact` tool handler | ✅ |

---

## Summary of Enhancements

### 1. Proactive Offers (New Behavior)

The agent will now **proactively offer** its capabilities at natural moments:

- **After discussing a motor for 30+ seconds**: "Want me to text you a link to this one?"
- **When customer hesitates**: "I can text you the details to show someone else"
- **When discussing promotions**: Auto-navigate to /promotions and point out the Choose One options
- **When customer is overwhelmed**: Offer to schedule a callback
- **When customer says "let me think about it"**: Offer to text specs
- **For complex questions**: Offer callback or contact form

### 2. New Navigation Tool: navigate_to_contact

Allows the agent to open the contact page when:
- Customer prefers written communication
- Question requires staff follow-up
- Customer wants to submit a detailed inquiry

### 3. Natural Phrasing Guidelines

Agent is instructed to use casual phrasing:
- ✅ "I can shoot you a text with all this"
- ✅ "Want me to text this to your phone?"
- ❌ "Would you like me to utilize our SMS functionality?"

---

## Testing Checklist

1. ☐ Start a voice conversation and ask about a motor
2. ☐ Wait for the agent to proactively offer to text you the info
3. ☐ Say "what promotions do you have" and verify it navigates to /promotions
4. ☐ Say "I have some technical questions about repowering" and verify it offers a callback OR navigates to contact
5. ☐ Say "let me think about it" and verify it offers to text the details
