

# Add Facebook Sign-In to AuthModal and SaveQuotePrompt

## Overview

Add Facebook OAuth sign-in button alongside the existing Google button in both the AuthModal and SaveQuotePrompt components. The Facebook OAuth is already implemented in `AuthProvider.tsx`, so we just need to create the button component and integrate it.

---

## Changes Summary

| File | Change |
|------|--------|
| `src/components/auth/FacebookSignInButton.tsx` | **Create** - New button component matching Google's structure |
| `src/components/auth/AuthModal.tsx` | Add Facebook button below Google button |
| `src/components/auth/SaveQuotePrompt.tsx` | Add Facebook button below Google button |
| `src/components/auth/AuthProvider.tsx` | Update `signInWithFacebook` to accept `redirectTo` parameter |

---

## Visual Layout After Changes

```text
┌─────────────────────────────────────────┐
│  [G] Continue with Google               │
├─────────────────────────────────────────┤
│  [f] Continue with Facebook             │
├─────────────────────────────────────────┤
│          ── or continue with email ──   │
├─────────────────────────────────────────┤
│  [Email/Password Form]                  │
└─────────────────────────────────────────┘
```

---

## Technical Details

### 1. Create FacebookSignInButton Component

**New file: `src/components/auth/FacebookSignInButton.tsx`**

Mirror the GoogleSignInButton structure:
- Accept `redirectTo`, `variant`, `className`, and `onError` props
- Use `signInWithFacebook` from AuthProvider
- Include Facebook's branded SVG icon (white "f" on blue background)
- Show loading spinner during auth flow

### 2. Update AuthProvider (Minor Change)

**File: `src/components/auth/AuthProvider.tsx`**

Update `signInWithFacebook` to accept optional `redirectTo` parameter (currently hardcoded to `/dashboard`):

```typescript
const signInWithFacebook = async (redirectTo?: string) => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: redirectTo || `${window.location.origin}/`
    }
  });
  return { error };
};
```

### 3. Update AuthModal

**File: `src/components/auth/AuthModal.tsx`**

Import and add FacebookSignInButton after Google button:

```tsx
<GoogleSignInButton onError={(err) => setError(err.message)} />
<FacebookSignInButton onError={(err) => setError(err.message)} />
```

### 4. Update SaveQuotePrompt

**File: `src/components/auth/SaveQuotePrompt.tsx`**

Import and add FacebookSignInButton after Google button with the same redirect URL pattern:

```tsx
<GoogleSignInButton redirectTo={redirectUrl} onError={...} />
<FacebookSignInButton redirectTo={redirectUrl} onError={...} />
```

---

## Files to Create/Modify

1. **`src/components/auth/FacebookSignInButton.tsx`** - Create new component
2. **`src/components/auth/AuthProvider.tsx`** - Add `redirectTo` param to Facebook function
3. **`src/components/auth/AuthModal.tsx`** - Add Facebook button
4. **`src/components/auth/SaveQuotePrompt.tsx`** - Add Facebook button

