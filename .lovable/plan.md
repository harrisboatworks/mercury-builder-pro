
# Fix Shared Quote Links - Add Public Read Access

## Problem

Shared quote links (`/quote/saved/:quoteId`) are not working because RLS policies block access:
- Admin-created quotes have `user_id = 'admin'` (not a real UUID)
- No RLS policy allows public/anonymous access to quotes via direct ID lookup
- The "Quote not found" error appears because the database query fails

## Solution

Add an RLS policy that allows **anyone** to read a quote **if they have the exact UUID**. This is secure because:
- Quote UUIDs are unguessable (cryptographically random)
- The link is only shared intentionally by the admin
- Similar to "unlisted" YouTube videos - public if you have the link

---

## Implementation

### Add New RLS Policy

Add a SELECT policy that allows reading quotes by their ID:

```sql
CREATE POLICY "Anyone can read quotes with direct link"
ON public.customer_quotes
FOR SELECT
USING (true);
```

**Alternative (more restrictive):** Only allow public access for admin-created quotes:

```sql
CREATE POLICY "Anyone can read admin-created quotes with direct link"
ON public.customer_quotes
FOR SELECT
USING (is_admin_quote = true);
```

---

## Trade-offs

| Option | Pros | Cons |
|--------|------|------|
| **Allow all SELECT** | Simple, all share links work | Customer-created quotes also accessible (but UUID is unguessable) |
| **Only admin quotes** | More restrictive | Need to ensure `is_admin_quote` is set correctly |

---

## Recommendation

Use the **admin quotes only** policy for better security hygiene:

```sql
-- Allow anyone to view admin-created quotes (shared links)
CREATE POLICY "Public read for admin shared quotes"
ON public.customer_quotes
FOR SELECT
TO anon, authenticated
USING (is_admin_quote = true);
```

This ensures:
1. ✅ Admin-shared links work for anyone (customers, prospects)
2. ✅ Customer quotes remain private (only visible to the user who created them)
3. ✅ Admins can still see all quotes via their existing policy

---

## Expected Result

After applying the policy:
1. Admin saves a quote and copies the share link
2. Anyone with the link can open it
3. Quote data loads and redirects to the Summary page
4. Customer sees their configured quote with all details
