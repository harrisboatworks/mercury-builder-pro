
# Fix Publishing Failures: Complete Edge Function Standardization + Dev Route Restoration

## Problem Summary

Your publish keeps failing despite the Vite build succeeding. After thorough investigation, I've identified **two root causes**:

1. **Edge Function Import Inconsistency**: 20+ edge functions still use mixed/outdated dependency versions that can fail during Deno deployment
2. **Dev Route Conflict**: You need `/dev` to work on the live site, but the current code gates it to development-only

---

## Root Cause Analysis

### Edge Functions Using Outdated Imports

| Version | Functions Affected |
|---------|-------------------|
| `@supabase/supabase-js@2.7.1` | `update-motor-images`, `generate-motor-spec-sheet` |
| `@supabase/supabase-js@2.39.3` | `scrape-motor-prices`, `send-repower-guide-email`, `process-email-sequence`, `track-email-event`, `unsubscribe-email-sequence`, `start-abandoned-quote-sequence`, `sync-google-sheets-inventory`, `sync-dropbox-folder`, `sync-dropbox-motor-folders` |
| `@supabase/supabase-js@2.47.10` | `trigger-zapier-webhooks`, `send-quote-email` |
| `@supabase/supabase-js@2.49.1` | `scrape-mercury-public` |
| `@supabase/supabase-js@2.57.2` | `stripe-webhook`, `create-payment` |
| `deno.land/std@0.168.0` | 15+ functions (mixing with `0.190.0`) |

When Lovable's publish system deploys these functions, `esm.sh` resolution can differ from what worked locally, causing random deployment failures.

---

## Implementation Plan

### Phase 1: Restore Dev Route for Production
Update `src/App.tsx` to unconditionally load the Dev page so it works on the live site.

**Change at line 105:**
```typescript
// Before (gates Dev to development only)
const Dev = import.meta.env.DEV ? lazy(() => import("./pages/Dev")) : NotFound;

// After (always available)
const Dev = lazy(() => import("./pages/Dev"));
```

> **Note**: This will include the ~21MB `@huggingface/transformers` in the production bundle. The build will be larger but the route will work.

### Phase 2: Standardize All Edge Function Imports
Update every edge function to use:
- `npm:@supabase/supabase-js@2.53.1` (stable, npm-resolved)
- `https://deno.land/std@0.190.0/http/server.ts` (consistent std version)

**Functions requiring updates (20 total):**

| Function | Current Supabase Version | Current std Version |
|----------|-------------------------|---------------------|
| `update-motor-images` | 2.7.1 | 0.168.0 |
| `generate-motor-spec-sheet` | 2.7.1 | 0.168.0 |
| `scrape-motor-prices` | 2.39.3 | 0.168.0 |
| `send-repower-guide-email` | 2.39.3 | 0.190.0 ✓ |
| `process-email-sequence` | 2.39.3 | 0.190.0 ✓ |
| `track-email-event` | 2.39.3 | 0.190.0 ✓ |
| `unsubscribe-email-sequence` | 2.39.3 | 0.190.0 ✓ |
| `start-abandoned-quote-sequence` | 2.39.3 | 0.190.0 ✓ |
| `sync-google-sheets-inventory` | 2.39.3 | (uses Deno.serve) |
| `sync-dropbox-folder` | 2.39.3 | (uses Deno.serve) |
| `sync-dropbox-motor-folders` | 2.39.3 | (uses Deno.serve) |
| `trigger-zapier-webhooks` | 2.47.10 | 0.168.0 |
| `send-quote-email` | 2.47.10 | 0.168.0 |
| `scrape-mercury-public` | 2.49.1 | 0.168.0 |
| `stripe-webhook` | 2.57.2 | 0.190.0 ✓ |
| `create-payment` | 2.57.2 | 0.190.0 ✓ |
| `scrape-motor-details` | 2.53.1 ✓ | 0.168.0 |
| `file-proxy` | 2.53.1 ✓ | 0.168.0 |
| `attach-brochure-pdf` | 2.53.1 ✓ | 0.168.0 |
| `upload-hero-image` | 2.53.1 ✓ | 0.168.0 |
| `sync-elevenlabs-static-kb` | (no supabase) | 0.168.0 |
| `realtime-session` | (no supabase) | 0.168.0 |
| `google-places` | (no supabase) | 0.168.0 |
| `dropbox-oauth` | (no supabase) | 0.168.0 |
| `get-dropbox-config` | (no supabase) | 0.168.0 |
| `realtime-sdp-exchange` | (no supabase) | 0.168.0 |
| `debug-xml-inventory` | (no supabase) | 0.168.0 |

### Phase 3: Verify and Publish
After all imports are standardized:
1. Attempt publish
2. If it still fails, check Supabase edge function deployment logs
3. Verify no migration drift between Test and Live environments

---

## Technical Details

### Standard Import Pattern (Target State)
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.53.1";
import { Resend } from "npm:resend@2.0.0";
```

For functions using `Deno.serve` (newer pattern), no `std` import is needed—just update the Supabase client.

### Why npm: Instead of esm.sh?
- `npm:` specifier is resolved by Deno's native NPM support
- More stable than `esm.sh` which can have CDN drift
- Recommended by Supabase for edge functions

---

## Files to Modify

### Frontend (1 file)
- `src/App.tsx` — Restore Dev route for production

### Edge Functions (26 files)
- `supabase/functions/update-motor-images/index.ts`
- `supabase/functions/generate-motor-spec-sheet/index.ts`
- `supabase/functions/scrape-motor-prices/index.ts`
- `supabase/functions/send-repower-guide-email/index.ts`
- `supabase/functions/process-email-sequence/index.ts`
- `supabase/functions/track-email-event/index.ts`
- `supabase/functions/unsubscribe-email-sequence/index.ts`
- `supabase/functions/start-abandoned-quote-sequence/index.ts`
- `supabase/functions/sync-google-sheets-inventory/index.ts`
- `supabase/functions/sync-dropbox-folder/index.ts`
- `supabase/functions/sync-dropbox-motor-folders/index.ts`
- `supabase/functions/trigger-zapier-webhooks/index.ts`
- `supabase/functions/send-quote-email/index.ts`
- `supabase/functions/scrape-mercury-public/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/create-payment/index.ts`
- `supabase/functions/scrape-motor-details/index.ts`
- `supabase/functions/file-proxy/index.ts`
- `supabase/functions/attach-brochure-pdf/index.ts`
- `supabase/functions/upload-hero-image/index.ts`
- `supabase/functions/sync-elevenlabs-static-kb/index.ts`
- `supabase/functions/realtime-session/index.ts`
- `supabase/functions/google-places/index.ts`
- `supabase/functions/dropbox-oauth/index.ts`
- `supabase/functions/get-dropbox-config/index.ts`
- `supabase/functions/realtime-sdp-exchange/index.ts`

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Larger production bundle (~21MB more) | Acceptable trade-off if `/dev` must work live |
| Edge function behavior change | Changes are import-only; no business logic modified |
| Stripe integration breaking | Version 2.53.1 is compatible; signature verification unchanged |

---

## Expected Outcome
After implementation, publishing should succeed because:
1. All edge functions use consistent, stable imports
2. No `esm.sh` resolution drift between local and deploy environments
3. The `/dev` route loads correctly in production
