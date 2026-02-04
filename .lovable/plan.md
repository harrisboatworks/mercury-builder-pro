
# Fix AI Chat, Voice Agent, and Nudge Messages for Options Page

## Problem Summary

Three issues identified on the Options page (`/quote/options`):

1. **Nudge Messages Wrong Context** - Current nudges talk about "packages" and "Complete" (warranty packages), but this page is about motor accessories
2. **AI Chat Missing Options Context** - No page-specific guidance for the Options page
3. **Voice Agent Skips Options** - Guided quote mode goes Motor → Purchase Path, skipping Options entirely

---

## Changes Required

### 1. Fix Nudge Messages in UnifiedMobileBar

**File:** `src/components/quote-builder/UnifiedMobileBar.tsx` (lines 80-94)

Replace the package-focused nudges with accessory-focused ones:

```typescript
'/quote/options': {
  primaryLabel: (state) => state.selectedOptions?.length ? 'Continue' : 'Continue',
  nextPath: '/quote/purchase-path',
  aiMessage: 'Need help choosing options or accessories?',
  nudges: {
    idle: [
      { delay: 10, message: 'Fuel tanks included with most 8-30HP motors', icon: 'check' },
      { delay: 18, message: 'SmartCraft Connect streams data to your phone', icon: 'sparkles' },
      { delay: 28, message: 'Pre-selected items are recommended for your motor', icon: 'heart' },
      { delay: 38, message: 'Tap any accessory for full details', icon: 'info' },
      { delay: 48, message: 'Not sure? Tap AI for accessory advice →', icon: 'sparkles' },
    ],
    withSelection: 'Good picks! These work great with your motor',
    withoutSelection: 'Recommended items are already selected for you',
    encouragement: 'Great accessories chosen!',
  }
}
```

---

### 2. Add Options Page Context to AI Chatbot

**File:** `supabase/functions/ai-chatbot-stream/index.ts`

Add page-specific context after the purchase-path context (around line 824):

```typescript
if (context?.currentPage?.includes('/quote/options')) {
  pageContext = `
## CURRENT PAGE: MOTOR OPTIONS & ACCESSORIES
The customer is viewing compatible add-ons for their selected motor. This is Step 2 of the quote process.

Options typically include:
- **SmartCraft Connect Mobile** ($325) - streams engine data to smartphone (for EFI motors 8HP+)
- **Fuel Tanks** - 12L or 25L portable tanks (many motors 8-30HP include one)
- **Service Kits** - 100-Hour or 300-Hour maintenance kits matched to their HP
- **Motor Covers** - UV/weather protection for storage

What to help with:
- Explain what SmartCraft Connect does and why it's useful
- Clarify which items are INCLUDED with their motor vs add-ons
- Help them understand the difference between required, recommended, and optional items
- "Recommended" items are pre-selected because they're popular for that motor

DON'T confuse this with the Package Selection page (warranty packages) - this is ACCESSORIES.
`;
}
```

---

### 3. Update Voice Agent Guided Quote Flow

**File:** `supabase/functions/elevenlabs-conversation-token/index.ts` (around lines 671-720)

Update the guided quote steps to include Options:

```typescript
**IF THEY ACCEPT - GUIDED QUOTE MODE:**
First call get_quote_status to see what's already in their quote, then walk them through remaining steps:

STEP 1 - MOTOR (if not already selected):
"What size motor are you looking for?" 
→ Help them find and select one, then use add_motor_to_quote

STEP 2 - OPTIONS (after motor is selected):
"Your motor comes with some recommended accessories pre-selected - things like SmartCraft Connect or a fuel tank. Want me to go over what's included, or skip ahead?"
→ Use go_to_quote_step('options') to show accessories
→ If they want details, explain SmartCraft Connect, fuel tanks, service kits
→ Most customers keep the recommended items

STEP 3 - PURCHASE PATH:
"Are you installing this yourself, or want us to handle it?"
→ Use set_purchase_path tool with 'loose' or 'installed'

STEP 4 - BOAT INFO (if they chose 'installed'):
"Tell me about your boat - what's the length and type?"
→ Use update_boat_info tool with their answers

STEP 5 - TRADE-IN:
"Got an old motor to trade in?"
→ If yes, use estimate_trade_value tool; if no, move on

STEP 6 - PROMO:
"For the bonus, you can choose the cash rebate, special financing, or 6 months no payments. Which sounds best?"
→ Use go_to_quote_step('promo') to show options

STEP 7 - SUMMARY:
"Here's your quote - [read the totals]. Ready to lock it in with a deposit, or want me to send this to your phone?"
→ Use go_to_quote_step('summary') to show final quote
```

---

### 4. Add Options Step to Voice Agent Navigation Tool

**File:** `supabase/functions/elevenlabs-mcp-server/index.ts`

Ensure the `go_to_quote_step` tool supports the 'options' step (if not already):

```typescript
case "go_to_quote_step": {
  const stepDescriptions: Record<string, string> = {
    motor: "motor selection",
    options: "accessories and options",  // ADD THIS
    boat: "boat information",
    addons: "accessories and add-ons",   // May be duplicate - check
    financing: "financing options",
    review: "quote review"
  };
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/quote-builder/UnifiedMobileBar.tsx` | Fix Options page nudge messages |
| `supabase/functions/ai-chatbot-stream/index.ts` | Add Options page context |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Add Options step to guided quote flow |
| `supabase/functions/elevenlabs-mcp-server/index.ts` | Verify 'options' step in navigation tool |

---

## Expected Outcome

- Nudge messages on Options page accurately describe accessories (SmartCraft, fuel tanks, etc.)
- AI chat provides contextual help about the accessories being shown
- Voice agent Harris guides customers through the Options step naturally
- Consistent messaging across all three interfaces
