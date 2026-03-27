

# Fix promotions_rules RLS — Restrict Write to Admins

## Problem
The `promotions_rules` table currently allows any authenticated user to INSERT, UPDATE, and DELETE rows. A logged-in customer could manipulate promotion rules.

## Fix
Drop the existing permissive write policy and replace with admin-only policies using `has_role(auth.uid(), 'admin'::app_role)`.

### Migration SQL
1. Drop existing overly-permissive policies on `promotions_rules`
2. Create admin-only policies for INSERT, UPDATE, DELETE
3. Keep SELECT open to authenticated users (rules need to be readable for the quote builder to apply promos)

| Operation | Access |
|-----------|--------|
| SELECT | Any authenticated user |
| INSERT | Admin only |
| UPDATE | Admin only |
| DELETE | Admin only |

## Files
| File | Change |
|------|--------|
| New migration | Drop old policies, create admin-restricted write policies |

