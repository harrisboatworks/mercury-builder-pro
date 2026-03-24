

# "Save My Quote" with Google Sign-In — Low-Friction Lead Capture

## The Psychology
Current flow: "Give us your name, email, phone" → feels like handing info to a salesman.
New flow: "Sign in with Google to save your quote" → feels like saving a bookmark. Customer thinks they're doing it for themselves. You get their name + email automatically from Google, plus the exact quote they configured.

---

## What Changes

### 1. New Component: `SaveQuoteWithAuth.tsx`
A dialog/drawer that appears when clicking "Save My Quote" on the summary page.

**Primary action**: "Continue with Google" button (one tap, zero forms)
- Uses existing `signInWithGoogle()` from AuthProvider
- After sign-in, auto-saves the current quote state to `saved_quotes` with their `user_id`
- Pulls name + email from their Google profile (already captured by Supabase auth)
- Sends admin notification (same SMS + email alerts as current flow)

**Secondary action**: "Continue with email" falls back to existing `SaveQuoteDialog` (name/email/phone form)

**UI tone**: Friendly, non-salesy
- Icon: Bookmark or Cloud
- Headline: "Save Your Quote"
- Subtext: "Sign in to keep this quote safe. Access it anytime from any device."
- Benefits list: "Pick up where you left off" / "Compare configurations" / "Share with a co-owner"
- Skip option: "No thanks, continue without saving"

### 2. Auto-Save on Auth Callback
When Google OAuth completes and redirects back to the summary page:
- Detect the returning auth session
- Auto-save the quote state from QuoteContext to `saved_quotes`
- Show a toast: "Quote saved to your account"
- Trigger admin notification in background

**File**: New `useAutoSaveQuoteOnAuth.ts` hook
- Watches for auth state change (null → user)
- Checks if there's an unsaved quote in QuoteContext
- Saves it and notifies admin
- Sets a flag so it doesn't re-trigger

### 3. Update Summary Page Flow
**File**: `src/pages/quote/QuoteSummaryPage.tsx`
- When user clicks "Save My Quote":
  - If already logged in → save immediately (no dialog needed), show toast
  - If not logged in → show the new `SaveQuoteWithAuth` dialog

### 4. Update StickySummary Button
**File**: `src/components/quote-builder/StickySummary.tsx`
- Change button label based on auth state:
  - Logged in: "Save Quote" (instant save, no dialog)
  - Not logged in: "Save My Quote" (opens auth dialog)

### 5. Admin Notification on Auth-Based Save
When a quote is saved via Google sign-in, trigger the same admin alerts:
- SMS to admin: "New saved quote! Name: [from Google], Email: [from Google], Motor: X, Price: $Y"
- Email notification
- Lead record in `customer_quotes`

This uses existing edge functions — no new backend needed.

---

## What Stays the Same
- "Email Me This Quote" form remains as the fallback for users who don't want to sign in
- Existing `SaveQuoteDialog` stays for that path
- The deposit/payment flow is unchanged
- `quote_activity_events` tracking continues for anonymous users

## Files Summary

| File | Change |
|------|--------|
| `src/components/quote-builder/SaveQuoteWithAuth.tsx` | New — auth-first save dialog with Google button |
| `src/hooks/useAutoSaveQuoteOnAuth.ts` | New — auto-saves quote when user returns from OAuth |
| `src/pages/quote/QuoteSummaryPage.tsx` | Update save handler to check auth state first |
| `src/components/quote-builder/StickySummary.tsx` | Adjust button label based on auth state |

## No Database Changes
The `saved_quotes` table already has `user_id`, `quote_state`, `resume_token`, and `expires_at`. Google sign-in users get their `user_id` linked automatically.

