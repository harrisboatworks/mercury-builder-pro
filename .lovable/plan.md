

## Add CC recipient to weekly report email

**File:** `supabase/functions/weekly-quote-report/index.ts`, line 712

**Change:** Add `harrisboatworks2153@manus.bot` to the existing `cc` array.

**Before:**
```typescript
cc: ["hbwbot00@gmail.com"],
```

**After:**
```typescript
cc: ["hbwbot00@gmail.com", "harrisboatworks2153@manus.bot"],
```

That's it — one line, no other changes needed.

