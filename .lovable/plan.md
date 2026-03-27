

# Fix Remaining Stale RLS Policies on promotions_rules (and promotions)

## Root Cause

Previous cleanup migrations dropped policies by name, but **missed the exact names** used in the original `20250811` migration:

| Policy name that EXISTS in DB | Was it dropped? |
|------|------|
| `Admins can insert promotions_rules` (uses `is_admin()`) | **No** — cleanup looked for "promotion rules" not "promotions_rules" |
| `Admins can update promotions_rules` (uses `is_admin()`) | **No** |
| `Admins can delete promotions_rules` (uses `is_admin()`) | **No** |
| `Public read access for promotions_rules` | **No** (harmless SELECT, but should be cleaned for clarity) |

These stale `is_admin()` policies are OR'd with the new `has_role()` ones, and since `is_admin()` may also be permissive, the scanner keeps flagging it.

## Fix

One new migration that drops every remaining stale policy name variant on both tables, ensuring only the clean `has_role()` policies survive.

### Policies to drop (promotions_rules)
- `Admins can insert promotions_rules`
- `Admins can update promotions_rules`
- `Admins can delete promotions_rules`
- `Public read access for promotions_rules`

### Policies to drop (promotions — belt-and-suspenders)
- `Admins can insert promotions` (old `is_admin()` version, if still present)
- `Admins can update promotions` (old `is_admin()` version)
- `Admins can delete promotions` (old `is_admin()` version)

After dropping, the only surviving policies will be the ones created in `20260327205925` using `has_role()`.

## File

| File | Change |
|------|--------|
| New migration | `DROP POLICY IF EXISTS` for every missed name variant on both tables |

