

# User Profile & Social Login Integration

## Overview

Enable users to create accounts using Google OAuth after submitting a quote. This creates a profile that saves their contact info and quotes for future visits and follow-ups.

---

## What Users Will Experience

After submitting a quote, users will see a prompt:

```text
┌─────────────────────────────────────────────────────┐
│                                                     │
│        ✓ Quote Submitted Successfully!              │
│                                                     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│        Save Your Quote & Info                       │
│                                                     │
│   Create an account to:                             │
│   • Access your quotes anytime                      │
│   • Speed up future quote requests                  │
│   • Get personalized follow-ups                     │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  [G] Continue with Google                   │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │     Create account with email               │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│            Skip for now                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Changes Summary

| Component | Change |
|-----------|--------|
| `AuthProvider.tsx` | Enable Google OAuth (currently disabled) |
| `AuthModal.tsx` | Add Google sign-in button |
| `QuoteSuccessPage.tsx` | Add account creation prompt with Google OAuth |
| `ScheduleConsultation.tsx` | Pass contact info to success page for profile pre-fill |
| Profile auto-update | Link saved quote to user account after signup |

---

## Technical Details

### 1. Enable Google OAuth in AuthProvider

**File: `src/components/auth/AuthProvider.tsx`**

Update `signInWithGoogle` to use Supabase OAuth:

```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/quote/success?oauth=google`
    }
  });
  return { error };
};
```

### 2. Add Google Button to AuthModal

**File: `src/components/auth/AuthModal.tsx`**

Add a Google sign-in button above the email/password form:

- Google branded button with icon
- Divider with "or"
- Existing email/password form

### 3. Create Account Prompt on Success Page

**File: `src/pages/quote/QuoteSuccessPage.tsx`**

Add a new section after the reference number:

- Check if user is already logged in → skip prompt
- Show Google OAuth button (primary)
- Show email signup option (secondary)
- "Skip for now" link
- After OAuth redirect, link existing saved quote to new user

### 4. Pass Contact Info Through Success Flow

**File: `src/components/quote-builder/ScheduleConsultation.tsx`**

When redirecting to success page, include contact info in URL or state:

```typescript
navigate(`/quote/success?ref=${refNumber}`, {
  state: {
    contactInfo: {
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    }
  }
});
```

### 5. Auto-Link Saved Quote After Signup

When a user signs up via OAuth on the success page:

1. Check for pending saved quote (by email match)
2. Update `saved_quotes.user_id` to new user's ID
3. Update `profiles` table with contact info from quote submission

---

## Database Impact

No schema changes required. Existing infrastructure supports this:

- `profiles` table with `phone` field
- `saved_quotes` table with `user_id` foreign key
- `handle_new_user()` trigger auto-creates profile on OAuth signup

---

## Flow Diagram

```text
User submits quote
       ↓
Success page shows
       ↓
User sees "Save Your Quote" prompt
       ↓
    ┌──┴──┐
    ↓     ↓
[Google] [Email]  [Skip]
    ↓     ↓        ↓
OAuth  Signup    Continue
flow   modal     without
    ↓     ↓      account
    └──┬──┘
       ↓
Profile created with:
- Google: name, email, avatar from OAuth
- Email: name from form
       ↓
saved_quote.user_id linked
profile.phone updated
       ↓
User can access /account/my-quotes
```

---

## Files to Modify

1. **`src/components/auth/AuthProvider.tsx`** - Enable Google OAuth
2. **`src/components/auth/AuthModal.tsx`** - Add Google button
3. **`src/pages/quote/QuoteSuccessPage.tsx`** - Add signup prompt
4. **`src/components/quote-builder/ScheduleConsultation.tsx`** - Pass contact info

