

# Fix: Remove Double Code Exchange Conflict

## Root Cause

The last two changes introduced a conflict:
- `detectSessionInUrl: true` + `flowType: 'pkce'` in the Supabase client config tells the client to **automatically** detect `?code=` in the URL and exchange it for a session during initialization
- The `RootRedirect` component **also** manually calls `exchangeCodeForSession(code)` on the same code

OAuth authorization codes are single-use. The automatic exchange uses the code first, then the manual exchange fails (silently). Additionally, there's a race condition: `setExchanging(false)` fires before `onAuthStateChange` updates the user state, causing the redirect to `/quote/motor-selection` with `user=null` instead of waiting for the session.

## Solution

Remove the manual `exchangeCodeForSession` call from `RootRedirect`. Instead, rely entirely on the Supabase client's built-in auto-detection (`detectSessionInUrl: true`). The `RootRedirect` component just needs to **wait** for the auth state to settle.

## Technical Change

### File: `src/App.tsx` -- Simplify RootRedirect

Replace the current `RootRedirect` with a simpler version that doesn't manually exchange codes:

```text
function RootRedirect() {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  const hasAuthParams = params.has('code') || 
                        hash.includes('access_token') || 
                        params.has('error');

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAuthParams && !loading) {
      navigate(user ? '/dashboard' : '/quote/motor-selection', { replace: true });
    }
  }, [loading, user, hasAuthParams, navigate]);

  if (hasAuthParams) {
    return <RouteLoader />;
  }

  return <Navigate to="/quote/motor-selection" replace />;
}
```

Key changes:
- Remove `useState` import for `exchanging` (no longer needed)
- Remove `supabase` import (no longer calling exchange manually)
- Remove the `exchangeCodeForSession` useEffect entirely
- Remove `exchanging` state and its dependency from the redirect useEffect
- The Supabase client's `detectSessionInUrl: true` handles the code exchange automatically during initialization

The `supabase/client.ts` changes from the previous fix (adding `flowType: 'pkce'` and `detectSessionInUrl: true`) remain in place -- those are correct and necessary.
