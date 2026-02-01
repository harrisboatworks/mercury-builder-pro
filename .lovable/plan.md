

# Voice-Guided Quote Builder Offer

## Overview

Add a proactive offer for the voice assistant to help users build their quote step-by-step, while maintaining all existing behavior. The agent will naturally offer: **"Would you like me to help build the quote with you?"** at key moments.

This feature enhances accessibility for users who may have difficulty navigating forms manually, while also providing a premium, concierge-like experience for all users.

## How It Will Work

```text
User opens voice chat
        ↓
Harris greets them normally
        ↓
At key moments (viewing a motor, asking about pricing, mentioning a quote):
        ↓
┌────────────────────────────────────────────────────┐
│ "By the way - if you want, I can walk you through  │
│ building the quote step by step. Just say 'help    │
│ me build a quote' and I'll guide you through it."  │
└────────────────────────────────────────────────────┘
        ↓
If they accept, Harris becomes a conversational guide:
  → "Great! What size motor are you looking for?"
  → "Got it - installing yourself or want us to handle it?"
  → "Tell me about your boat - length and type?"
  → ...continues through each step...
```

## Changes Required

### 1. System Prompt Enhancement (Edge Function)

**File: `supabase/functions/elevenlabs-conversation-token/index.ts`**

Add a new section to the system prompt that instructs the agent when and how to offer guided quote building:

```text
## GUIDED QUOTE BUILDING (ACCESSIBILITY-FRIENDLY OFFER):
You can offer to help build the quote step-by-step. This is especially helpful 
for customers who prefer voice navigation or find forms difficult.

**WHEN TO OFFER (choose naturally, don't force it):**
- When a customer seems interested in a motor but hasn't started a quote
- When they ask "how do I get a quote?" or "what's the process?"
- When they say they're "thinking about it" or seem uncertain how to proceed
- After discussing a motor for 30+ seconds without them taking action

**HOW TO OFFER (casual, not pushy):**
- "Want me to walk you through building a quote? I can do it step by step with you."
- "I can help you build the quote if you want - just talk me through it."
- "Happy to guide you through the quote process if that's easier."

**IF THEY ACCEPT - GUIDED QUOTE MODE:**
Walk them through each step conversationally:

STEP 1 - MOTOR (if not already selected):
"What size motor are you looking for?" 
→ Help them find and select one, then add to quote

STEP 2 - PURCHASE PATH:
"Are you installing this yourself, or want us to handle it?"
→ Use set_purchase_path tool

STEP 3 - BOAT INFO (if installed):
"Tell me about your boat - what's the length and type?"
→ Collect length, type, transom height naturally

STEP 4 - TRADE-IN:
"Got an old motor to trade in?"
→ If yes, use estimate_trade_value; if no, move on

STEP 5 - PROMO:
"For the bonus, you can choose the cash rebate, special financing, 
or 6 months no payments. Which sounds best?"
→ Navigate to promo selection

STEP 6 - SUMMARY:
"Here's your quote - [read the totals]. Ready to lock it in 
with a deposit, or want me to send this to your phone?"

**RULES FOR GUIDED MODE:**
- Keep each step brief - one question at a time
- Confirm before moving to next step: "Got it - moving on..."
- If they go off-topic, answer their question, then: "Back to your quote..."
- Don't be robotic - adapt to their pace
- Use the appropriate tools (set_purchase_path, go_to_quote_step, etc.) to control the screen
```

### 2. Add a New Client Tool: `get_quote_status`

**File: `src/hooks/useElevenLabsVoice.ts`**

Add a tool that lets the agent check what's already in the quote so it knows which steps to skip:

```typescript
// Get current quote progress for guided mode
get_quote_status: () => {
  const ctx = options.quoteContext;
  const status = {
    hasMotor: !!ctx?.selectedMotor,
    motorModel: ctx?.selectedMotor?.model || null,
    hasPurchasePath: !!ctx?.purchasePath,
    purchasePath: ctx?.purchasePath || null,
    hasBoatInfo: !!(ctx?.boatInfo?.length || ctx?.boatInfo?.type),
    hasTradeIn: ctx?.tradeInValue !== null && ctx?.tradeInValue !== undefined,
    tradeInValue: ctx?.tradeInValue || null,
  };
  
  // Determine next step
  let nextStep = 'motor';
  if (status.hasMotor && !status.hasPurchasePath) nextStep = 'path';
  else if (status.hasPurchasePath && !status.hasBoatInfo && status.purchasePath === 'installed') nextStep = 'boat';
  else if (status.hasBoatInfo || status.purchasePath === 'loose') nextStep = 'trade-in';
  else if (status.hasTradeIn !== null) nextStep = 'promo';
  
  return JSON.stringify({
    ...status,
    nextStep,
    readyForSummary: status.hasMotor && status.hasPurchasePath
  });
}
```

### 3. Add Helper Tool: `update_boat_info`

**File: `src/hooks/useElevenLabsVoice.ts`**

Add a tool to directly set boat information from voice:

```typescript
// Update boat information for quote
update_boat_info: (params: { 
  length?: number; 
  type?: string; 
  transom_height?: string 
}) => {
  console.log('[ClientTool] update_boat_info', params);
  
  dispatchVoiceNavigation({ 
    type: 'update_boat_info', 
    payload: { 
      length: params.length,
      type: params.type,
    } 
  });
  
  return JSON.stringify({
    success: true,
    message: `Got it - ${params.length ? params.length + ' foot' : ''} ${params.type || 'boat'}.`
  });
}
```

### 4. New Event Handler in VoiceContext

**File: `src/contexts/VoiceContext.tsx`**

Ensure `update_boat_info` events are handled (may already exist, needs verification):

```typescript
if (type === 'update_boat_info' && payload) {
  const { length, type: boatType } = payload;
  // Update quote context with boat info
  dispatch({ type: 'SET_BOAT_INFO', payload: { length, type: boatType } });
  // Navigate to boat info page if not already there
  if (!location.pathname.includes('/quote/boat-info')) {
    navigate('/quote/boat-info');
  }
}
```

### 5. Register New Tools in ElevenLabs Dashboard

The following tools need to be configured in the ElevenLabs Agent web UI:

| Tool Name | Parameters | Description |
|-----------|------------|-------------|
| `get_quote_status` | (none) | Returns current quote progress |
| `update_boat_info` | `length: number`, `type: string` | Sets boat info |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Add GUIDED QUOTE BUILDING section to system prompt |
| `src/hooks/useElevenLabsVoice.ts` | Add `get_quote_status` and `update_boat_info` client tools |
| `src/contexts/VoiceContext.tsx` | Ensure `update_boat_info` event is handled |
| `src/lib/voiceNavigation.ts` | Verify `update_boat_info` event type exists (already present) |
| **ElevenLabs Dashboard** | Register new tools with matching schemas |

## Example Guided Flow

```text
User: "I'm looking at that 115 HP motor"
Harris: "The 115 EFI - solid choice at eighty-five forty-five. 
         Want me to help build a quote for it? I can walk you through step by step."

User: "Yeah, that'd be great"
Harris: [add_motor_to_quote] "Got it added! Installing this yourself or 
         want us to do the full setup?"

User: "You guys can do it"
Harris: [set_purchase_path('installed')] "Perfect - professional install it is. 
         Tell me about your boat - what length and type?"

User: "It's a 17 foot aluminum fishing boat"
Harris: [update_boat_info] "17 foot aluminum - nice. 
         Got anything to trade in?"

User: "No, not this time"
Harris: [go_to_quote_step('promo')] "No problem. For the bonus, you've got three choices - 
         the cash rebate, special financing, or 6 months no payments. 
         Which sounds best?"

User: "I'll take the rebate"
Harris: [navigate promo selection] "Smart choice - that's $600 back. 
         Here's your full quote: motor at eighty-five forty-five, 
         installation labor, minus your rebate... comes to about nine grand total. 
         Want to lock it in with a deposit, or should I text this to your phone?"
```

## Accessibility Benefits

- **Motor impairments**: No need to tap small buttons or scroll
- **Visual impairments**: Fully navigable by voice
- **Cognitive load**: One question at a time, guided step-by-step
- **Elderly users**: Feels like talking to a helpful salesperson
- **General convenience**: Hands-free while on a boat or in the garage

## Technical Notes

- All existing voice functionality remains unchanged
- The guided mode is opt-in via natural language acceptance
- Existing tools (`add_motor_to_quote`, `set_purchase_path`, `go_to_quote_step`) are reused
- Quote context is read in real-time via `quoteContext` prop
- Agent can exit guided mode anytime if user goes off-topic

