

## Fix Quote Summary Chat: Motor-Aware Prompts + Financing Gate

### Problem 1: Financing prompts shown for sub-$5k motors
The summary page suggested questions (in `getContextualPrompts.ts`, lines 114-121) are hardcoded and always include "What's my monthly payment?" and "What are my financing options?" -- even when the motor is under $5,000, where financing is not available per policy.

### Problem 2: Prompts don't reference the motor
The same hardcoded prompts are generic ("What's my monthly payment?") with no motor name. When the user taps one, the AI receives a vague question without motor context in the message itself. While the system prompt does include motor info, the AI may still respond generically because the user's question doesn't reference a specific motor.

### Fixes

**File: `src/components/chat/getContextualPrompts.ts`**

1. Update the summary page section (lines 113-121) to accept the `motor` parameter and make prompts motor-aware:
   - Include the motor name in prompts (e.g., "How long until my 6HP FourStroke is ready?")
   - Check motor price/HP to determine financing eligibility
   - If motor is under $5k (roughly under 40HP as a proxy, or pass price): show non-financing prompts like "Any rebates on this motor?" instead of "What's my monthly payment?"
   - If motor is $5k+: keep financing-related prompts

2. The function signature already receives `motor: Motor | null`, so no interface changes needed. We just need to use it in the summary block.

### Example prompt sets after fix

**Sub-$5k motor (e.g., 6HP FourStroke):**
- "Any current rebates on the 6HP?"
- "How long until my 6HP is ready?"
- "What's included with my motor?"
- "Can you walk me through the quote?"

**$5k+ motor (e.g., 150HP Pro XS):**
- "What's my monthly payment on the 150HP?"
- "Can you get me a better price?"
- "How long until my Pro XS is ready?"
- "What are my financing options?"

### Technical Details

- The `getContextualPrompts` function already receives a `motor` object with `model` and `hp` fields
- We'll use `hp` as a proxy for the $5k threshold: motors under ~40HP are generally under $5k. Alternatively, we can check `motor.price` if available in the interface (it's not currently -- the Motor interface in this file only has `model`, `hp`, and `horsepower`)
- Safest approach: add an optional `price` field to the local Motor interface and pass it from `EnhancedChatWidget.tsx` and `InlineChatDrawer.tsx` where motor price is available via `state.motor.price`
- Use `FINANCING_MINIMUM` constant from `@/lib/finance` for the threshold check to stay consistent with the rest of the app

### Files Changed

1. **`src/components/chat/getContextualPrompts.ts`**
   - Add `price?: number` to the local Motor interface
   - Update summary page prompts to use motor name and conditionally show/hide financing prompts based on price vs FINANCING_MINIMUM

2. **`src/components/chat/EnhancedChatWidget.tsx`**
   - Pass `price` when constructing the motor object for `getContextualPromptsWithPerplexity` (~line 176)

3. **`src/components/chat/InlineChatDrawer.tsx`**
   - Same change: pass `price` in the motor object for contextual prompts
