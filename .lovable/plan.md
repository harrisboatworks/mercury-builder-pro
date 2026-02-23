

# Security Advisor Warnings - Remediation Plan

## Summary

There are **3 categories** of warnings. Two require code changes, and most of the third are **false positives** (safe as-is).

---

## 1. Function Search Path Mutable (2 fixes)

Two database functions are missing `SET search_path = public`, which could allow search path manipulation attacks:

| Function | Fix |
|----------|-----|
| `public.update_motor_media_summary` | Add `SET search_path TO 'public'` |
| `public.get_cron_job_status` | Add `SET search_path TO 'public'` |

**Migration**: `ALTER FUNCTION` to add the search_path setting to each.

---

## 2. RLS Policy Always True (3 actionable fixes)

| Table | Policy | Issue | Fix |
|-------|--------|-------|-----|
| `google_places_cache` | "Service role can manage cache" | `USING (true)` for ALL on role `-` | Restrict to `service_role` explicitly or drop the policy (service_role bypasses RLS anyway) |
| `mercury_parts_cache` | "Service role can manage mercury_parts_cache" | Same as above | Same fix - drop the policy since service_role bypasses RLS |
| `share_analytics` | "Anyone can insert share analytics" | `WITH CHECK (true)` for INSERT | Add basic input validation (e.g., require non-null share_token, limit string lengths) |
| `voice_reminders` | "Anyone can create reminders" | `WITH CHECK (true)` for INSERT | Add validation (require phone number format, limit fields) |
| `webhook_activity_logs` | "System can insert webhook activity logs" | `WITH CHECK (true)` for INSERT on `-` | Restrict to `service_role` or admin only |

---

## 3. Anonymous Access Policies (no action needed)

The ~25+ `auth_allow_anonymous_sign_ins` warnings are **false positives**. These policies use `has_role(auth.uid(), 'admin')` checks, meaning anonymous users are technically "allowed" by the policy target roles but will always fail the admin check. No changes needed.

---

## Technical Details

### Migration 1: Fix function search paths
```sql
ALTER FUNCTION public.update_motor_media_summary()
  SET search_path TO 'public';

ALTER FUNCTION public.get_cron_job_status()
  SET search_path TO 'public';
```

### Migration 2: Fix overly permissive RLS policies
- **Drop** the two cache table policies (service_role bypasses RLS, so these policies do nothing useful)
- **Tighten** `share_analytics` INSERT to require a non-null `share_token`
- **Tighten** `voice_reminders` INSERT to validate phone number length
- **Restrict** `webhook_activity_logs` INSERT to admin-only

This will resolve all WARN-level findings from the security advisor.

