

# Fix: Google OAuth Login Not Working

## Root Cause

When Google OAuth completes, Supabase redirects back to `https://mercuryrepower.ca/?code=XXXX` with an authorization code. However, the root route `/` has a `<Navigate to="/quote/motor-selection" replace />` that immediately redirects away, **stripping the `?code=` query parameter before the Supabase client can exchange it for a session token**.

## Solution

Update the root route to preserve OAuth callback parameters. When the URL contains auth-related query parameters (`code`, `access_token`, `refresh_token`, `error`), we should let the Supabase client process them before redirecting.

## Technical Changes

### File: `src/App.tsx`

Replace the simple `Navigate` on the root route with a small component that:
1. Checks if the URL has OAuth callback parameters (`code`, `access_token`, `error`)
2. If yes, renders a loading spinner and lets `AuthProvider` process the tokens (via `onAuthStateChange` / `getSession()`) -- then redirects after the session is established
3. If no, immediately redirects to `/quote/motor-selection` as before

```text
// New component (inline or separate file):
function RootRedirect() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const hasAuthParams = params.has('code') || 
                        hash.includes('access_token') || 
                        params.has('error');

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAuthParams) {
      // Wait for auth to finish processing
      if (!loading) {
        navigate(user ? '/dashboard' : '/quote/motor-selection', { replace: true });
      }
    }
  }, [loading, user, hasAuthParams]);

  if (hasAuthParams) {
    return <LoadingSpinner />;  // Show spinner while processing auth
  }

  return <Navigate to="/quote/motor-selection" replace />;
}
```

Then update the route:
```
<Route path="/" element={<RootRedirect />} />
```

This is a minimal, targeted fix. No other files need to change.

