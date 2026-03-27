

# Fix: Build Error from Deno Edge Function Imports

## Problem
The Vite/TypeScript build is picking up `supabase/functions/audit-price-list/index.ts` and trying to resolve `npm:resend@2.0.0` through Node's module system. Deno-style `npm:` specifiers aren't valid in a Vite/Node context.

## Root Cause
`tsconfig.app.json` has `"include": ["src"]` which should exclude `supabase/`, but the TypeScript project references or file discovery is still finding edge function files.

## Fix

### `tsconfig.app.json`
Add an explicit `exclude` array:
```json
"exclude": ["supabase"]
```

### `tsconfig.node.json` (if needed)
Also add `"exclude": ["supabase"]` if this file doesn't already exclude it.

This tells TypeScript to completely ignore the Deno edge function files during the Vite build. The edge functions are deployed separately by Supabase and don't need Vite's type checking.

## Files

| File | Change |
|------|--------|
| `tsconfig.app.json` | Add `"exclude": ["supabase"]` |
| `tsconfig.node.json` | Add `"exclude": ["supabase"]` if not already excluded |

