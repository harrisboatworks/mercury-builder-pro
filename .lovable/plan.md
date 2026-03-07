

## Problem: Anonymous visitor tracking is silently blocked by RLS

The `quote_activity_events` table has RLS enabled with this INSERT policy:

```
"Only admins can insert activity events"
WITH CHECK: has_role(auth.uid(), 'admin'::app_role)
```

This means **every anonymous visitor on mercuryrepower.ca has their page views and quote activity silently rejected**. The tracker code catches all errors silently (`catch { /* silent */ }`), so you never see failures. Only your own logged-in admin sessions and the Lovable preview (which bypasses RLS) successfully write data.

This is why you only see 5 sessions — they're all you or the Lovable preview environment.

## Fix

**Single migration** to replace the admin-only INSERT policy with one that allows anyone (anonymous or authenticated) to insert analytics events, while keeping SELECT restricted to admins only:

```sql
-- Drop the restrictive insert policy
DROP POLICY "Only admins can insert activity events" ON public.quote_activity_events;

-- Allow anonymous + authenticated users to insert analytics events
CREATE POLICY "Anyone can insert activity events"
ON public.quote_activity_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```

The existing SELECT policy (`"Admins can read activity events"`) remains unchanged — only admins can read the data. This is safe because:
- The table contains no PII (session IDs, page paths, device types, UTM params)
- INSERT-only access means visitors cannot read or modify other visitors' data
- The data is write-only analytics telemetry

No code changes needed. The trackers (`usePageViewTracker` and `useQuoteActivityTracker`) are already correctly implemented — they just need the RLS gate opened for inserts.

