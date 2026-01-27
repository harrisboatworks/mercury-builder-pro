
# Fix: Voice Chat Inventory Check Looping

## ✅ COMPLETED

**Status:** All changes implemented and deployed.

---

## Problem Fixed

When users asked the voice assistant about inventory (e.g., "do you have any 20 HP motors?"), the agent was getting stuck in a loop repeatedly saying "let me check" or "checking inventory" without providing an answer.

---

## Changes Made

### 1. Tool Chain Tracking (`src/hooks/useElevenLabsVoice.ts`)
- Added `activeToolsRef` to track which tools are currently executing
- Added `lastToolChainStartRef` to track when tool chains started
- Added `lastNavigationRef` to track recent navigation HP for deduplication

### 2. Increased Thinking Watchdog Delay
- Changed `THINKING_WATCHDOG_MS` from 600ms to **2000ms**
- Added `TOOL_CHAIN_TIMEOUT_MS` constant (5 seconds)
- This prevents the nudge message from interrupting legitimate tool operations

### 3. Navigate-First Fallback Guards
- Added guard to skip fallback when tools are already active
- Added tool chain timeout check (5 seconds) with graceful recovery message
- Prevents duplicate context updates when agent is already processing

### 4. Check Inventory Deduplication
- Modified `check_inventory` tool to skip redundant lookups
- If `navigate_to_motors` was called with same HP within 3 seconds, returns early
- Tells agent to use `get_visible_motors` instead of re-querying database

### 5. Simplified Agent System Prompt (`elevenlabs-conversation-token`)
- Consolidated inventory tool instructions into single clear flow
- Explicit "DO NOT" list to prevent looping behaviors
- Emphasized: `navigate_to_motors` → `get_visible_motors` → Speak (done!)
- Removed confusing competing instructions about `check_inventory`

---

## Expected Behavior

| Before | After |
|--------|-------|
| Agent loops "let me check... checking inventory... let me check..." | Agent navigates once, reads screen, responds |
| Multiple redundant tool calls | Single efficient tool chain |
| Watchdog nudge interrupts mid-tool | Watchdog only fires after tools complete |
| No abort for stuck operations | 5-second timeout with graceful fallback |

---

## Files Modified
- `src/hooks/useElevenLabsVoice.ts` - Tool chain tracking, deduplication, guards
- `supabase/functions/elevenlabs-conversation-token/index.ts` - Simplified agent instructions
