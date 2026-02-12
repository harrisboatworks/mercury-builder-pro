

# TikTok Integration: Privacy Page + OAuth Callback

## What We're Building

Three things to get the TikTok integration working on mercuryrepower.ca:

### 1. Privacy Policy Page (`/privacy`)
A standalone page similar to the Terms page, covering:
- What data is collected (name, email, phone from quotes/financing)
- How it's used (quote generation, communication)
- Third-party services (Supabase, Stripe, TikTok)
- Data retention and deletion rights
- PIPEDA compliance (Canadian privacy law)
- Contact information for privacy inquiries

### 2. TikTok OAuth Callback Edge Function
An edge function at `auth-tiktok-callback` that:
- Receives the authorization code from TikTok after user login
- Exchanges it for access and refresh tokens using the Client Secret
- Stores tokens securely in a `tiktok_tokens` database table
- Redirects the user back to the site

A frontend route at `/auth/tiktok/callback` will forward the OAuth code to the edge function.

### 3. Secure Credential Storage
Store the TikTok Client Key and Client Secret as Supabase secrets accessible only from edge functions.

---

## Technical Details

### New Files

**`src/pages/Privacy.tsx`**
- Static content page using `LuxuryHeader` and `prose` styling (same pattern as Terms page)
- Covers: data collection, usage, third parties, retention, rights, PIPEDA, contact
- Accessible only via direct URL (not added to navigation)

**`supabase/functions/auth-tiktok-callback/index.ts`**
- Handles `GET` requests with `code` query parameter from TikTok OAuth redirect
- Exchanges code for tokens via TikTok's `https://open.tiktokapis.com/v2/oauth/token/` endpoint
- Stores tokens in a `tiktok_tokens` table (admin-only access)
- Redirects to a success page or admin dashboard after completion
- Uses `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` from Supabase secrets

**`src/pages/TikTokCallback.tsx`**
- Simple page at `/auth/tiktok/callback` that reads the `code` from the URL
- Calls the edge function to complete the token exchange
- Shows loading state and success/error feedback

### Modified Files

**`src/App.tsx`**
- Add route: `/privacy` pointing to `Privacy` component
- Add route: `/auth/tiktok/callback` pointing to `TikTokCallback` component

**`supabase/config.toml`**
- Add `[functions.auth-tiktok-callback]` with `verify_jwt = false` (TikTok redirects unauthenticated)

### Database

New table: `tiktok_tokens`
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `access_token` (text, encrypted)
- `refresh_token` (text, encrypted)
- `expires_at` (timestamptz)
- `scope` (text)
- `created_at` / `updated_at`
- RLS: admin-only read/write

### Secrets to Add
- `TIKTOK_CLIENT_KEY`: `aw3hweyvikuvjifo`
- `TIKTOK_CLIENT_SECRET`: (the secret from the setup message -- recommend rotating it first)

### Sequence

```text
User clicks "Connect TikTok"
  --> Redirected to TikTok authorization URL
  --> User approves permissions
  --> TikTok redirects to /auth/tiktok/callback?code=XXXX
  --> TikTokCallback page sends code to edge function
  --> Edge function exchanges code for tokens
  --> Tokens stored in tiktok_tokens table
  --> User redirected to admin dashboard with success message
```

