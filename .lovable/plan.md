

# Fix: Mobile Chat Failing on Streaming Connection Drop

## Problem
When you tap a quick question on mobile, the AI chat sends a **streaming (SSE) request** to `ai-chatbot-stream`. On mobile networks, the connection drops before the response completes, causing the "Http: connection closed before message completed" error server-side. The client then shows the generic error message.

## Root Causes
1. **Missing API key header** in `src/lib/streamParser.ts` -- the fetch call to the edge function omits the `apikey` header, which can cause issues with Supabase's gateway on certain networks
2. **No retry or fallback** -- when streaming fails on mobile (common on cellular), there is no fallback to a simpler non-streaming request
3. **Long server processing time** -- the edge function fetches inventory, promotions, and potentially Perplexity data before responding, which can take several seconds. Mobile connections may time out during this wait

## Plan

### 1. Add missing `apikey` header to stream requests
**File:** `src/lib/streamParser.ts`
- Add the Supabase anon key to the fetch headers so the request is properly authenticated through the gateway

### 2. Add automatic retry with non-streaming fallback
**File:** `src/lib/streamParser.ts`
- If the streaming fetch fails or the connection drops, automatically retry once with `stream: false`
- Parse the JSON response and simulate typewriter effect (this path already exists in the code but only triggers when the content-type isn't SSE)

### 3. Add connection timeout for mobile
**File:** `src/lib/streamParser.ts`
- Add an `AbortController` with a 25-second timeout to prevent indefinite hangs on mobile
- If the timeout fires, fall back to the non-streaming path

### 4. Improve error handling in InlineChatDrawer
**File:** `src/components/chat/InlineChatDrawer.tsx`
- Update the `onError` handler to show a more helpful message with a "Retry" option instead of immediately showing the "text us" fallback

## Technical Details

```text
Current flow (broken on mobile):
  Phone -> SSE stream request -> Edge Function builds prompt (3-5s) -> Streams response
                                    ^-- mobile connection drops here

Fixed flow:
  Phone -> SSE stream request (with apikey + 25s timeout)
    |-- Success: stream response as before
    |-- Fail/timeout: auto-retry with non-streaming JSON request
        |-- Success: typewriter effect from JSON response
        |-- Fail: show error with retry button
```

### Files to modify:
- `src/lib/streamParser.ts` (add apikey header, retry logic, timeout)
- `src/components/chat/InlineChatDrawer.tsx` (retry button on error)
