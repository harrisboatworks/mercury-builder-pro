
# Fix: Voice Chat Inventory Check Looping

## Problem Identified

When users ask the voice assistant about inventory (e.g., "do you have any 20 HP motors?"), the agent gets stuck in a loop repeatedly saying "let me check" or "checking inventory" without providing an answer. This creates a frustrating experience.

## Root Cause Analysis

After reviewing the codebase, I identified several contributing factors:

### 1. Tool Call Conflict Pattern
The current flow creates a "double-check" pattern:
1. User asks about motors
2. **Navigate-First Safety Net** (line 1400-1428) auto-navigates and sends a context update
3. Agent also calls `navigate_to_motors` tool (as instructed in system prompt)
4. Agent then calls `check_inventory` tool (another database lookup)
5. Agent then calls `get_visible_motors` tool
6. Multiple overlapping responses confuse the agent

### 2. Agent Instructions Encourage Looping
The system prompt (elevenlabs-conversation-token) contains multiple competing instructions:
- Rule #2 says "Call navigate_to_motors IMMEDIATELY"
- Another section says "THEN call get_visible_motors"
- Another says to use `check_inventory` for inventory queries
- The agent interprets these as needing to call ALL tools, causing repetitive tool calls

### 3. Missing Timeout/Abort on Tool Chains
When the agent calls multiple tools in sequence, there's no mechanism to:
- Prevent redundant tool calls
- Set a maximum tool chain length
- Abort if taking too long

### 4. Thinking Watchdog Nudge Message Backfires
The 600ms watchdog (line 17-18) sends a nudge telling the agent NOT to say "let me check", but this fires too quickly during legitimate tool calls, confusing the agent mid-operation.

---

## Solution Overview

| File | Change |
|------|--------|
| `src/hooks/useElevenLabsVoice.ts` | Add tool chain tracking and abort mechanism |
| `src/hooks/useElevenLabsVoice.ts` | Increase thinking watchdog to 2000ms |
| `src/hooks/useElevenLabsVoice.ts` | Deduplicate navigate + inventory lookups |
| `supabase/functions/elevenlabs-conversation-token/index.ts` | Simplify agent instructions to reduce tool call confusion |

---

## Technical Implementation

### 1. Add Tool Chain Tracking (useElevenLabsVoice.ts)

Track when tools are in flight to prevent the navigate-first fallback from firing during an active tool chain:

```typescript
// Add new ref to track active tool calls
const activeToolsRef = useRef<Set<string>>(new Set());
const lastToolChainStartRef = useRef<number>(0);

// In withSearchingFeedback wrapper:
// Track tool as active
activeToolsRef.current.add(toolName);
if (activeToolsRef.current.size === 1) {
  lastToolChainStartRef.current = Date.now();
}

// On completion, remove from active set
activeToolsRef.current.delete(toolName);
```

### 2. Prevent Fallback During Active Tool Chain

In the navigate-first safety net (around line 1400), add a guard:

```typescript
// DON'T fire fallback if tools are already processing
if (activeToolsRef.current.size > 0) {
  console.log('[Navigate-First] Skipping - tools already active');
  return;
}
```

### 3. Increase Thinking Watchdog Delay

Change from 600ms to 2000ms to avoid interrupting legitimate tool operations:

```typescript
// Line 17 - change from 600 to 2000
const THINKING_WATCHDOG_MS = 2000;
```

### 4. Add Tool Call Deduplication

Prevent redundant check_inventory calls when navigate_to_motors was already called:

```typescript
// Track last navigation to dedupe inventory checks
const lastNavigationRef = useRef<{hp: number, timestamp: number} | null>(null);

// In check_inventory tool:
check_inventory: withSearchingFeedback(
  'check_inventory',
  async (params) => {
    // If we just navigated to same HP within 3 seconds, skip redundant lookup
    const recentNav = lastNavigationRef.current;
    if (recentNav && 
        recentNav.hp === params.horsepower && 
        Date.now() - recentNav.timestamp < 3000) {
      console.log('[check_inventory] Skipping - recent navigation covered this');
      return JSON.stringify({ 
        message: "Already showing these motors on screen.",
        hint: "Call get_visible_motors to describe what's displayed"
      });
    }
    return await handleInventoryLookup('check_inventory', params);
  },
  'Checking inventory...'
),
```

### 5. Simplify Agent System Prompt

In `elevenlabs-conversation-token/index.ts`, consolidate the tool instructions:

```typescript
## INVENTORY TOOLS - SIMPLIFIED FLOW:
When customer asks about motors by HP:
1. Call navigate_to_motors({ horsepower: X }) - this shows motors AND loads inventory
2. Call get_visible_motors() - this tells you what's on screen
3. Describe what you see

❌ DO NOT call check_inventory after navigate_to_motors - it's redundant!
❌ DO NOT say "let me check" - the screen is already showing the answer!

The navigate_to_motors tool handles everything:
- Navigates the browser
- Filters by HP/config
- Loads all matching motors

Just read from get_visible_motors and talk about what's there.
```

### 6. Add Tool Chain Timeout

If tool chain exceeds 5 seconds, abort and provide graceful response:

```typescript
// In the navigate-first fallback setTimeout (line 1406-1427)
setTimeout(() => {
  // Abort if tool chain is taking too long
  if (activeToolsRef.current.size > 0 && 
      Date.now() - lastToolChainStartRef.current > 5000) {
    console.warn('[Voice] Tool chain timeout - clearing and providing fallback');
    activeToolsRef.current.clear();
    // Send recovery context to agent
    if (conversationRef.current?.status === 'connected') {
      const recoveryMsg = "[SYSTEM: Tool lookup is taking long. Just describe what you know about this HP range and offer to check specific questions.]";
      conversationRef.current.sendUserMessage(recoveryMsg);
    }
  }
  // ... rest of fallback logic
}, 600);
```

---

## Expected Behavior After Fix

| Before | After |
|--------|-------|
| Agent loops "let me check... checking inventory... let me check..." | Agent navigates once, reads screen, responds |
| Multiple redundant tool calls | Single efficient tool chain |
| Watchdog nudge interrupts mid-tool | Watchdog only fires after tools complete |
| No abort for stuck operations | 5-second timeout with graceful fallback |

---

## Summary

This fix addresses the looping behavior through four mechanisms:
1. **Tool chain tracking** - Prevents overlapping tool executions
2. **Deduplication** - Skips redundant inventory checks after navigation
3. **Extended watchdog** - Gives tools time to complete before nudging
4. **Simplified instructions** - Reduces agent confusion about which tools to call

The changes maintain all existing functionality while eliminating the frustrating loop behavior customers experience when asking about inventory.
