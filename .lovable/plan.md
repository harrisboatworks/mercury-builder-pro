
# Fix Spec Sheet PDF Missing "Why Boaters Love This Motor" Insights

## The Problem

The PDF you downloaded is missing the "Why Boaters Love This Motor" section that we built earlier. The edge function is working correctly (I tested it and got great insights), but the browser is failing to fetch them due to a CORS header mismatch.

The network logs show:
```
Request: POST .../generate-spec-sheet-insights
Error: Failed to fetch
```

The edge function only allows these headers:
- `authorization`, `x-client-info`, `apikey`, `content-type`

But the Supabase client is also sending:
- `x-session-id`
- `x-supabase-client-platform`
- `x-supabase-client-platform-version`
- `x-supabase-client-runtime`
- `x-supabase-client-runtime-version`

This causes the browser's preflight CORS check to fail, so the insights fetch silently fails and the PDF is generated without them.

## The Fix

### 1. Update CORS Headers in Edge Function

Update `generate-spec-sheet-insights` to accept all the headers the Supabase client sends:

```typescript
// supabase/functions/generate-spec-sheet-insights/index.ts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
```

### 2. Add Better Error Logging

Update `SpecSheetPDFDownload.tsx` to log when insights fail so we can debug more easily:

```typescript
} catch (insightError) {
  console.error('Failed to fetch insights:', insightError);
  // Continue without insights - they're optional
}
```

### 3. Redeploy the Edge Function

After updating, the edge function needs to be redeployed.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-spec-sheet-insights/index.ts` | Update CORS headers to accept all Supabase client headers |
| `src/components/motors/SpecSheetPDFDownload.tsx` | Improve error logging |

## Expected Result

After this fix, when you download a spec sheet:

1. The insights fetch will succeed
2. The PDF will include the "Why Boaters Love This Motor" section with 3 compelling reasons
3. For this 5HP motor, you'll see things like:
   - "Ultra-lightweight design makes this perfect for car-top boats"
   - "Built-in fuel tank means less gear to haul"
   - "Exceptionally quiet operation won't disturb the fish"
