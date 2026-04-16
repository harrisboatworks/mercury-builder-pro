

# Fix 2 Storage Policy Vulnerabilities

## Issues from security scan

### 1. Quote PDFs readable by any authenticated user (CRITICAL)
The policy "Authenticated users can read quotes PDFs" on `storage.objects` grants SELECT to all authenticated users with no ownership check. Any logged-in customer can enumerate and download other customers' quote PDFs containing financial and personal data.

**Fix:** Replace with an ownership-scoped policy. Quote PDF paths follow the pattern `{user_id}/...`. The new policy checks that `(storage.foldername(name))[1] = auth.uid()::text` — so users can only read their own folder. Admins bypass via `has_role()`.

### 2. Inventory photos deletable by any authenticated user (WARN)
The policy "Authenticated users can delete inventory photos" allows any logged-in user to delete files from `inventory-photos`. Only admins upload/manage these.

**Fix:** Replace with admin-only DELETE policy using `has_role(auth.uid(), 'admin')`.

## Migration SQL

```sql
-- 1. Fix quotes bucket: scope reads to owner or admin
DROP POLICY IF EXISTS "Authenticated users can read quotes PDFs"
  ON storage.objects;

CREATE POLICY "Users can read own quote PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'quotes'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- 2. Fix inventory-photos: admin-only delete
DROP POLICY IF EXISTS "Authenticated users can delete inventory photos"
  ON storage.objects;

CREATE POLICY "Admins can delete inventory photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'inventory-photos'
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );
```

## What won't break
- Edge Functions generate/read quotes with `service_role` — unaffected by RLS
- Customers viewing their own quote PDFs — path includes their user_id
- Admin viewing any quote — bypassed via `has_role()`
- Public viewing of motor/hero images — different buckets, untouched

## Files changed
| Change | Detail |
|--------|--------|
| 1 migration | Fix 2 storage policies (quotes read + inventory-photos delete) |
| 2 scan findings marked fixed | Update security scan status |

