
# Fix Voice Chat "Unavailable" Error with Token Fetch Retry

## Problem Identified

When trying to start voice chat, the app shows "Voice chat unavailable" because the ElevenLabs conversation token fetch is failing with "Failed to fetch" network errors.

**Evidence from logs:**
- OPTIONS preflight requests succeed (200 status)
- POST requests fail with "Failed to fetch" before reaching the server
- The edge function itself works correctly (tested directly)
- Multiple rapid requests in quick succession may be getting aborted

## Root Cause

The token fetch in `useElevenLabsVoice.ts` has **no retry logic** for network failures. When the first request fails (even due to transient issues), the voice chat immediately shows as unavailable.

This is different from the WebRTC connection which has 3 retries with exponential backoff.

## Solution

Add retry logic with exponential backoff to the token fetch, similar to the WebRTC connection retry pattern already in the code.

## Implementation

### File: `src/hooks/useElevenLabsVoice.ts`

Wrap the token fetch in a retry loop (lines ~2359-2397):

```typescript
// PARALLELIZED with RETRY: Load previous context, get token simultaneously
console.log('Fetching ElevenLabs conversation token...');
let tokenData: { token: string } | null = null;
let previousContext: any = null;

// Load previous context (non-critical, don't retry)
previousContext = await voiceSession.loadPreviousSessionContext().catch(err => {
  console.warn('[Voice] Failed to load previous context:', err);
  return null;
});

if (previousContext?.totalPreviousChats > 0) {
  console.log('[Voice] Returning customer:', previousContext.totalPreviousChats, 'previous chats');
}

// Token fetch with retry logic
const TOKEN_RETRIES = 3;
let tokenError: Error | null = null;

for (let attempt = 1; attempt <= TOKEN_RETRIES; attempt++) {
  try {
    console.log(`[Voice] Token fetch attempt ${attempt}/${TOKEN_RETRIES}...`);
    
    // Pre-warm on first attempt only
    if (attempt === 1) {
      prewarmEdgeFunctions().catch(() => {});
    }
    
    const tokenResult = await supabase.functions.invoke('elevenlabs-conversation-token', {
      body: { 
        motorContext: options.motorContext,
        currentPage: options.currentPage,
        quoteContext: options.quoteContext,
      }
    });
    
    if (tokenResult.error) {
      throw new Error(tokenResult.error.message || 'Token request failed');
    }
    
    if (!tokenResult.data?.token) {
      throw new Error('No token in response');
    }
    
    tokenData = tokenResult.data;
    console.log('[Voice] Token received successfully');
    break; // Success - exit retry loop
    
  } catch (err) {
    tokenError = err instanceof Error ? err : new Error('Token fetch failed');
    console.warn(`[Voice] Token attempt ${attempt} failed:`, tokenError.message);
    
    if (attempt < TOKEN_RETRIES) {
      // Exponential backoff: 500ms, 1000ms, 2000ms
      const delay = Math.pow(2, attempt - 1) * 500;
      console.log(`[Voice] Waiting ${delay}ms before retry...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

if (!tokenData) {
  throw new Error('Unable to get voice session. Please check your connection and try again.');
}
```

## Why This Works

1. **Resilience**: Transient network blips don't immediately fail voice chat
2. **Exponential backoff**: Prevents hammering the server (500ms → 1s → 2s delays)
3. **Matches existing pattern**: Same retry approach as WebRTC connection (lines 2406-2449)
4. **User-friendly**: Only shows "unavailable" after 3 genuine failures

## Testing

After this fix:
1. Open voice chat - should connect normally
2. If first request fails due to network, automatic retry should succeed
3. Only after 3 failures should "Voice chat unavailable" appear
