

# Warm-Up Ping for `get-shared-quote` Edge Function

## What This Does

Fires a lightweight no-op request to the `get-shared-quote` edge function when the app first loads. This wakes up the Deno isolate so that when a customer clicks a shared quote link, the function is already warm and responds in ~200ms instead of 2-5 seconds.

## Why It's Worth It

- Shared quote links are the primary way customers access their quotes
- Cold starts on Supabase Edge Functions take 2-5 seconds
- The ping is a single tiny POST request — no meaningful cost or bandwidth

## Changes

### 1. `src/App.tsx` — Add warm-up ping on mount

Inside the `App` component (convert to a function body with a `useEffect`), fire a one-time ping to `get-shared-quote` with a `{ ping: true }` body. Use `fetch` directly (not `supabase.functions.invoke`) to keep it lightweight. Fire-and-forget — no error handling needed.

```typescript
useEffect(() => {
  // Warm up the shared-quote edge function to eliminate cold starts
  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ ping: true }),
  }).catch(() => {});
}, []);
```

### 2. `supabase/functions/get-shared-quote/index.ts` — Handle ping early

Add a short-circuit at the top of the handler (after CORS) to return immediately for ping requests:

```typescript
const body = await req.json();
if (body?.ping) {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

This avoids creating a Supabase client or hitting the database for warm-up pings.

## Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `useEffect` warm-up ping on mount |
| `supabase/functions/get-shared-quote/index.ts` | Add early return for `{ ping: true }` |

