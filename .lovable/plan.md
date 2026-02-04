
Goal: Fix the recurring “Voice chat unavailable”/tool failures by addressing the real failing request shown in logs: calls to the `voice-inventory-lookup` Edge Function are being blocked at the browser/network layer (“Failed to fetch”), while `elevenlabs-conversation-token` is succeeding.

What the logs show (key findings)
- The ElevenLabs token function is working:
  - Browser network: `POST /functions/v1/elevenlabs-conversation-token` returns 200 and JSON (warmup ok).
  - Edge logs: token requested, system prompt built, “Conversation token received successfully”.
- The inventory tool function is not reachable from the browser:
  - Browser network: `POST /functions/v1/voice-inventory-lookup` fails with “Failed to fetch” even for `{ action: "ping" }`.
  - Edge logs for `voice-inventory-lookup` show only “booted/listening”, and no per-request logs like `Voice inventory lookup: ping` — consistent with CORS/preflight blocking before the request hits the function.
- Code confirms a CORS mismatch:
  - `supabase/functions/_shared/cors.ts` already allows `x-session-id` and sets `Access-Control-Allow-Methods`.
  - But `supabase/functions/voice-inventory-lookup/index.ts` defines its own `corsHeaders` with:
    - `Access-Control-Allow-Headers`: only `"authorization, x-client-info, apikey, content-type"`
    - No `Access-Control-Allow-Methods`
  - The browser is sending `x-session-id` for these function calls (visible in network logs). That header is not allowed by this function’s CORS config, causing the fetch to fail.

Root cause
- `voice-inventory-lookup` Edge Function is using an outdated/local CORS header list that does not include `x-session-id` (and doesn’t declare allowed methods). The browser blocks the request (including simple “ping”) before it reaches the function, producing “Failed to fetch”.
- This cascades into the voice tool flow because ElevenLabs “client tools” (like `check_inventory`) rely on `voice-inventory-lookup` to respond.

Implementation plan (code changes)
1) Standardize `voice-inventory-lookup` CORS to use the shared CORS module
   - File: `supabase/functions/voice-inventory-lookup/index.ts`
   - Replace the local `corsHeaders` object with:
     - `import { corsHeaders } from "../_shared/cors.ts";`
   - Ensure OPTIONS is handled as it already is:
     - `if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });`
   - Ensure all responses include the shared headers:
     - For JSON responses: `headers: { ...corsHeaders, "Content-Type": "application/json" }`
   - This will allow:
     - `x-session-id`
     - Standard Supabase headers
     - Allowed methods including POST/OPTIONS

2) Add the “Supabase client platform/runtime” headers to shared CORS if needed (optional hardening)
   - Only if we observe preflight still failing after step (1).
   - Your `elevenlabs-conversation-token` already allows these headers; the shared `_shared/cors.ts` currently does not.
   - Since the browser logs for `voice-inventory-lookup` only show `x-client-info` and `x-session-id` today, step (1) should be sufficient; this is a fallback.

3) Verify with targeted runtime checks
   - Browser-side verification:
     - Confirm that `POST /functions/v1/voice-inventory-lookup` for `{ action: "ping" }` returns 200 and JSON.
     - Confirm that `check_inventory` tool calls no longer throw `FunctionsFetchError`.
   - Server-side verification:
     - Supabase Edge logs should now show `Voice inventory lookup: ping` when warmup happens and show action logs during real tool usage.
   - End-to-end:
     - Start voice chat → ask “Do you have any nine point nine horsepower motors?” and verify:
       - Voice tool calls succeed
       - No “Voice chat unavailable” popups triggered by tool failures
       - UI navigates/updates as expected

Expected outcome
- `voice-inventory-lookup` becomes reachable from the browser in all environments.
- ElevenLabs client tools (inventory lookup) stop failing with “Failed to fetch”.
- “Voice chat unavailable” should disappear for the flows that depended on inventory tools; if any remaining “unavailable” occurs, it will be isolated to token/session start and can be addressed separately with clearer diagnostics.

Risks / edge cases
- Cached edge function deployment: after deploying, users may need a hard refresh.
- If another function (besides `voice-inventory-lookup`) is used by client tools and has similar local CORS headers, we’ll need to standardize those too; we can quickly scan other functions for locally-defined `corsHeaders` that omit `x-session-id`.

Concrete checklist
- [ ] Update `voice-inventory-lookup` to import and use `_shared/cors.ts`
- [ ] Redeploy `voice-inventory-lookup`
- [ ] Re-test in browser: ping + real `check_inventory` tool call
- [ ] If still failing: extend `_shared/cors.ts` to include `x-supabase-client-*` headers to match token function
