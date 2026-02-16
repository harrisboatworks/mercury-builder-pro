

## Fix: Payment Error — CORS Header Mismatch in `create-payment` Edge Function

### Root Cause

The Supabase client (`src/integrations/supabase/client.ts`, line 63) globally adds an `x-session-id` header to every request. When the browser sends a CORS preflight (OPTIONS) to the `create-payment` edge function, the function's `Access-Control-Allow-Headers` only lists `authorization, x-client-info, apikey, content-type` — it does NOT include `x-session-id`.

The browser rejects the preflight, the POST never fires, and the client gets "Failed to fetch."

### Fix

**File: `supabase/functions/create-payment/index.ts`** (line 8)

Update the CORS headers to include the full set of headers the Supabase JS client sends:

```
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
```

The key addition is `x-session-id`, but including the other standard Supabase client headers prevents the same issue if the SDK adds them in future versions.

### Files Changed
1. **`supabase/functions/create-payment/index.ts`** — Update CORS `Access-Control-Allow-Headers` (line 8) to include `x-session-id` and other Supabase client headers

### After Fix
Redeploy the edge function and the Reserve button on the quote summary page will work correctly.

