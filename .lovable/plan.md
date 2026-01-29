
# Enhance Voice Agent with Proactive Offers & Lead Capture

## Problem

The voice agent currently has powerful tools (SMS, email, callbacks, navigation) but:
1. **Customers don't know these capabilities exist** - they won't ask for something they don't know is available
2. **Agent waits to be asked** instead of proactively offering to help
3. **No contact page navigation** - can't guide users to the full contact form if needed
4. **Promotion info not offered proactively** when discussing motors

## Solution

Update the voice agent to **proactively offer** its capabilities at natural moments in the conversation, and add a new tool to navigate to the contact page when needed.

---

## Changes Overview

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Add proactive offer instructions to system prompt |
| `supabase/functions/elevenlabs-mcp-server/index.ts` | Add `navigate_to_contact` tool definition |
| `src/hooks/useElevenLabsVoice.ts` | Add client-side `navigate_to_contact` tool handler |
| `src/lib/voiceNavigation.ts` | Add `navigate_to_contact` event type |

---

## Technical Details

### 1. Add Proactive Offer Instructions to System Prompt

**File:** `supabase/functions/elevenlabs-conversation-token/index.ts`

Add a new section to the prompt after "SENDING MOTOR INFO" that teaches the agent when to proactively offer its capabilities:

```text
## PROACTIVE OFFERS (USE THESE NATURALLY):

Customers don't know you can send texts, emails, or control their screen. 
PROACTIVELY OFFER these at the right moments:

**After discussing a specific motor for 30+ seconds:**
"Want me to text you a link to this one so you can pull it up later?"

**When customer seems interested but hesitant:**
"I can text you the details if you want to show someone else — just need your cell."

**When discussing the current promotion:**
"By the way, this qualifies for our Get 7 promo — want me to show you the bonus options on screen?"
→ Then use navigate_to_promotions

**When customer has lots of questions or seems overwhelmed:**
"Happy to keep going, but if you'd rather chat with someone directly, I can have one of our guys call you back. What works better?"
→ If they want a callback, use schedule_callback

**When customer says "I'll think about it" or "let me check with my spouse":**
"Totally get it. Want me to text you the specs so you have something to show them?"
→ Collect phone → send_motor_photos

**When customer asks complex questions you can't fully answer:**
"That's a great question for our service guys — want me to set up a quick callback?"
→ Or: "You can also fill out our contact form and someone will get back to you today."
→ Use navigate_to_contact

**NATURAL PHRASING (don't sound robotic):**
- ✅ "I can shoot you a text with all this if that helps"
- ✅ "Want me to text this to your phone?"
- ✅ "If you give me your cell, I'll send you a link"
- ❌ "Would you like me to utilize our SMS functionality?"
- ❌ "I can leverage our text messaging capability"

**RULES:**
- Offer ONCE per conversation topic (don't keep asking)
- If they decline, respect it — don't push
- Always ask for contact info BEFORE saying you'll send something
```

### 2. Add `navigate_to_contact` Tool Definition

**File:** `supabase/functions/elevenlabs-mcp-server/index.ts`

Add to the TOOLS array:

```typescript
{
  name: "navigate_to_contact",
  description: "Navigate the customer to the contact page for detailed inquiries. Use when customer wants to fill out a contact form or needs help with complex questions.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

Add to the switch statement:

```typescript
case "navigate_to_contact": {
  return { 
    content: [{ 
      type: "text", 
      text: JSON.stringify({
        action: "navigate_to_contact",
        clientAction: true,
        message: "I've opened our contact page. You can fill out the form there and someone will get back to you within 24 hours!"
      })
    }] 
  };
}
```

### 3. Add Client-Side Tool Handler

**File:** `src/hooks/useElevenLabsVoice.ts`

Add to the clientTools object (near `navigate_to_promotions`):

```typescript
navigate_to_contact: () => {
  console.log('[ClientTool] navigate_to_contact');
  dispatchVoiceNavigation({ type: 'navigate', payload: { path: '/contact' } });
  
  return JSON.stringify({
    success: true,
    message: "I've opened our contact page. Feel free to fill out the form — someone will get back to you within 24 hours!",
    navigated: true
  });
},
```

### 4. Update System Prompt Navigation Tools Section

**File:** `supabase/functions/elevenlabs-conversation-token/index.ts`

Update the NAVIGATION TOOLS section:

```text
## NAVIGATION TOOLS - USE PROACTIVELY:
**CRITICAL: These tools control the customer's screen. Use them when appropriate:**

- **navigate_to_motors** - Filter and show motors by HP/config
- **navigate_to_promotions** - Open the promotions page. Use for deals, specials, "Get 7"
- **navigate_to_contact** - Open the contact form. Use for complex inquiries or when customer prefers written communication
- **show_motor** - Open detail modal for a specific motor
- **go_to_quote_step** - Navigate to a quote step
```

---

## Expected Agent Behavior Examples

**Scenario 1: Customer browsing motors**
> Customer: "This 20 ELH looks good"
> Agent: "Yeah, the 20 ELH is a solid choice — electric start, long shaft, tiller. Forty-six fifty-five. Want me to text you a link so you can pull it up later?"

**Scenario 2: Customer asking about promotion**
> Customer: "What deals do you have?"
> Agent: "Right now it's our Get 7 — you get 7 years warranty plus you pick one bonus: special financing, deferred payments, or factory cash back. Let me show you the page..." *(navigates to /promotions)*

**Scenario 3: Customer overwhelmed**
> Customer: "I don't know, I have a lot of questions about repower and my transom..."
> Agent: "Totally understand — transom stuff can get technical. Want me to have one of our guys call you? They can walk through everything based on your specific boat."

**Scenario 4: Customer wants to think about it**
> Customer: "Let me talk to my wife first"
> Agent: "Makes sense! Want me to text you the specs? Then you'll have something to show her."

---

## Testing Checklist

After implementation:
1. Start a voice conversation and ask about a motor
2. Wait for the agent to proactively offer to text you the info
3. Say "what promotions do you have" and verify it navigates to /promotions
4. Say "I have some technical questions about repowering" and verify it offers a callback OR navigates to contact
5. Say "let me think about it" and verify it offers to text the details
