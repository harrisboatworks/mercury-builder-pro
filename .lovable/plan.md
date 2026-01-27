
# Fix: Voice Chat Inventory Loop - Stop Endless "Checking" Messages

## Problem
When asking about motor inventory, the voice agent enters an infinite loop saying "let me check" or "checking inventory" without ever providing an answer.

## Root Causes Identified

1. **Thinking watchdog fires during tool operations**: The 2000ms watchdog sends a nudge message even when tools are actively processing, causing the agent to repeat "checking inventory"
2. **Agent ignores "Navigate-First" rule**: Despite system prompt instructions, the agent sometimes calls `check_inventory` after `navigate_to_motors`, leading to redundant operations
3. **Multiple conflicting context injections**: The 600ms fallback timer, thinking watchdog, and tool completions can all send messages to the agent simultaneously
4. **Tool chain timeout not clearing watchdog**: When tools are running, the thinking watchdog should be paused but isn't

---

## Solution

### Fix 1: Clear Thinking Watchdog When Tools Start

**File: `src/hooks/useElevenLabsVoice.ts`**

In the `withSearchingFeedback` wrapper, mark the agent as "responded" when a tool starts (since tool execution IS a form of response). This prevents the watchdog from firing during legitimate tool operations.

```typescript
// Inside withSearchingFeedback, after activeToolsRef.current.add(toolName):
agentRespondedRef.current = true; // Tool starting = agent IS responding
clearThinkingWatchdog(); // Don't nudge while tools are running
```

### Fix 2: Suppress Redundant check_inventory Completely

**File: `src/hooks/useElevenLabsVoice.ts`**

Enhance the `check_inventory` deduplication to return a clearer "NO-OP" response that tells the agent to just describe what's on screen instead of repeating "checking":

```typescript
// In check_inventory tool (line 1646-1658)
if (recentNav && params.horsepower && recentNav.hp === params.horsepower && Date.now() - recentNav.timestamp < 5000) {
  // Extend window from 3s to 5s
  // Return more explicit instruction
  return JSON.stringify({ 
    skipped: true,
    instruction: "SCREEN ALREADY SHOWS THIS DATA. Do NOT say 'checking' or 'let me look'. Just describe the motors visible on screen.",
    hint: "Use get_visible_motors if needed, or just describe what you know"
  });
}
```

### Fix 3: Disable Thinking Nudge During Active Tool Chains

**File: `src/hooks/useElevenLabsVoice.ts`**

Modify `startThinkingWatchdog` to check if tools are active before nudging:

```typescript
// In startThinkingWatchdog callback (around line 1229)
thinkingWatchdogRef.current = setTimeout(() => {
  // GUARD: Don't nudge if tools are actively processing
  if (activeToolsRef.current.size > 0) {
    console.log('[Watchdog] Tools active - skipping nudge');
    return;
  }
  
  if (!agentRespondedRef.current && !thinkingNudgeSentRef.current) {
    // ... existing nudge logic
  }
}, THINKING_WATCHDOG_MS);
```

### Fix 4: Prevent Fallback Context During Tool Chains

**File: `src/hooks/useElevenLabsVoice.ts`**

The 600ms fallback already has a guard, but the timing is too short. Increase to 1200ms to give tools more time:

```typescript
// Line 1486: Change 600ms to 1200ms
setTimeout(() => {
  // ... fallback logic
}, 1200); // Was 600ms
```

### Fix 5: Strengthen System Prompt

**File: `supabase/functions/elevenlabs-conversation-token/index.ts`**

Add an even more explicit rule about not saying "checking" or "let me check":

```
## 🚨 RULE #3 — NEVER SAY "CHECKING" OR "LET ME CHECK":
- ❌ DO NOT say "let me check inventory", "checking now", "one moment while I look"
- ❌ DO NOT repeat yourself if you've already navigated
- ✅ DO say "Here's what we have..." and describe what's on screen
- ✅ If screen shows the data, just DESCRIBE it - don't announce you're looking it up

After calling navigate_to_motors, the screen ALREADY shows the answer. Just describe it.
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useElevenLabsVoice.ts` | Fix thinking watchdog, extend dedup window, clear watchdog on tool start |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Add Rule #3 about never saying "checking" |

---

## Technical Details

### Change 1: Clear watchdog when tools start (useElevenLabsVoice.ts ~line 1055)
Add `agentRespondedRef.current = true` and `clearThinkingWatchdog()` inside `withSearchingFeedback`

### Change 2: Guard watchdog against active tools (useElevenLabsVoice.ts ~line 1229)
Add `if (activeToolsRef.current.size > 0) return;` inside the timeout

### Change 3: Extend dedup window and improve response (useElevenLabsVoice.ts ~line 1646)
Change `3000` to `5000` and add `instruction` field to response

### Change 4: Increase fallback delay (useElevenLabsVoice.ts ~line 1486)
Change `600` to `1200`

### Change 5: Add Rule #3 to system prompt (elevenlabs-conversation-token/index.ts ~line 329)
Add new rule section after Rule #2

---

## Expected Result

After these changes:
- Agent will NOT say "checking inventory" or "let me check" repeatedly
- Tool operations will complete without being interrupted by watchdog nudges
- Redundant `check_inventory` calls will return a clear "screen already shows this" instruction
- Agent will describe motors immediately after navigation instead of announcing lookups

## Testing
1. Ask "do you have 20 HP motors?"
2. Agent should navigate, then immediately describe what's shown (not say "checking")
3. No looping or repeated "checking" messages
