

# Complete Publishing Fix: Remove Heavy Dependencies + Security Hardening

## Problem Summary

The publish is failing because the production bundle includes a **21.6 MB WASM file** (`ort-wasm-simd-threaded.jsep.wasm`) from `@huggingface/transformers`. This happens because the `/dev` route is now unconditionally loaded, which imports the `ImageProcessor` component that uses AI-based background removal.

Additionally, there are **security vulnerabilities** that need to be addressed:
- `chat_messages` table is publicly readable (exposing ~330 private messages)
- `email_sequence_queue` table has RLS enabled but no policies

---

## Root Cause Analysis

### Build Size Issue

| File | Size | Source |
|------|------|--------|
| `ort-wasm-simd-threaded.jsep.wasm` | 21.6 MB | `@huggingface/transformers` via Dev page |

The problem chain:
1. `src/App.tsx:105` → unconditionally imports `Dev.tsx`
2. `src/pages/Dev.tsx:4` → imports `ImageProcessor`
3. `src/components/ui/image-processor.tsx` → imports `processSpeedBoatImage`
4. `src/utils/processSpeedBoatImage.ts` → imports `removeBackground`
5. `src/lib/backgroundRemoval.ts` → imports `@huggingface/transformers`
6. `@huggingface/transformers` → bundles ONNX runtime WASM (21.6 MB)

Even with lazy loading, Vite still analyzes the import tree and includes the WASM file in the production bundle because it's referenced via `new URL()` patterns.

### Security Issues

1. **`chat_messages`**: Has `FOR SELECT USING (true)` policy allowing anyone to read all messages
2. **`email_sequence_queue`**: RLS enabled but no policies defined (blocks all access by default, but needs proper admin policies)

---

## Implementation Plan

### Phase 1: Fix Bundle Size (Keep /dev Working)

Remove the `ImageProcessor` from the Dev page. The `/dev` route will retain its core functionality (quote list, seed quote) but exclude the heavy AI background removal tool.

**File: `src/pages/Dev.tsx`**
```typescript
// Remove this import:
// import { ImageProcessor } from '@/components/ui/image-processor';

// Remove from JSX:
// <ImageProcessor />
```

This keeps `/dev` working in production for its primary purpose while removing the 21.6 MB dependency from the bundle.

### Phase 2: Secure chat_messages Table

Add proper RLS policies so users can only see messages from their own conversations.

**Database Migration:**
```sql
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow read access to chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_select_policy" ON public.chat_messages;

-- Create secure policies
CREATE POLICY "Users can view own chat messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR session_id IN (
    SELECT session_id FROM public.chat_messages WHERE user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert own chat messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anonymous users can insert chat messages"
ON public.chat_messages FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Admins can manage all chat messages"
ON public.chat_messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

### Phase 3: Secure email_sequence_queue Table

Add admin-only policies for managing email sequences.

**Database Migration:**
```sql
-- Admin-only access for email sequence queue
CREATE POLICY "Admins can view email sequences"
ON public.email_sequence_queue FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage email sequences"
ON public.email_sequence_queue FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Service role (edge functions) can manage sequences
CREATE POLICY "Service role can manage email sequences"
ON public.email_sequence_queue FOR ALL
TO service_role
USING (true);
```

---

## Files to Modify

### Frontend (1 file)
| File | Change |
|------|--------|
| `src/pages/Dev.tsx` | Remove `ImageProcessor` import and usage |

### Database (1 migration)
| Action | Tables Affected |
|--------|-----------------|
| Add secure RLS policies | `chat_messages`, `email_sequence_queue` |

---

## Technical Details

### Why This Fixes the Build

The `@huggingface/transformers` library uses ONNX runtime which includes WASM binaries. Even with dynamic imports, Vite's bundler statically analyzes the import graph and includes referenced WASM files. By removing the import chain entirely from the Dev page, the 21.6 MB file is excluded from the production bundle.

### What /dev Will Retain
- Quote listing functionality
- Seed quote creation button
- Admin debugging tools

### What /dev Will Lose
- AI-powered background removal (can be moved to a separate admin-only tool if needed later)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| /dev loses background removal | This is rarely used; can be re-added as separate admin tool |
| RLS policy breaks existing queries | Policies allow authenticated users to see own data + admins |
| Edge functions can't access email queue | Added `service_role` policy for edge functions |

---

## Expected Outcome

After implementation:
1. Production bundle size reduced by ~21 MB
2. Publishing should succeed without size/timeout issues
3. `chat_messages` properly secured (users see only their own messages)
4. `email_sequence_queue` secured (admin + service role only)
5. `/dev` route works in production with core functionality

