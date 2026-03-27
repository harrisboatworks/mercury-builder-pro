

# Fix RLS on Both `promotions_rules` AND `promotions` Tables

## Problem

The scanner still flags both tables because:
- **`promotions`** table was never cleaned up — it still has the original permissive policies (`auth.uid() IS NOT NULL`) from an early migration, plus stale `is_admin()` policies
- **`promotions_rules`** may have duplicate policies (old `is_admin()` ones coexisting with the new `has_role()` ones)

Multiple overlapping policies on the same table are OR'd together in Postgres — so one permissive policy defeats all restrictive ones.

## Fix

One new migration that:

1. Drops ALL existing write policies on **both** tables (by every name variant that's ever been used)
2. Drops any stale SELECT policies to avoid duplicates
3. Creates clean policies using `has_role(auth.uid(), 'admin'::app_role)`

| Table | Operation | Access |
|-------|-----------|--------|
| `promotions` | SELECT | Any authenticated user |
| `promotions` | INSERT | Admin only |
| `promotions` | UPDATE | Admin only |
| `promotions` | DELETE | Admin only |
| `promotions_rules` | SELECT | Any authenticated user |
| `promotions_rules` | INSERT | Admin only |
| `promotions_rules` | UPDATE | Admin only |
| `promotions_rules` | DELETE | Admin only |

## File

| File | Change |
|------|--------|
| New migration | Drop all old policies on both tables, recreate with `has_role()` |

After this, mark the `promotions_rules_any_authenticated_user_write` finding as resolved.

