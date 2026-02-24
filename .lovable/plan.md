
# Fix: Google OAuth PKCE Code Exchange

## Root Cause (Updated)

The previous fix correctly prevents the immediate redirect from stripping the `?code=` parameter, but the Supabase client still isn't exchanging the code for a session. Two issues:

1. **No explicit `flowType: 'pkce'`** in the Supabase client config -- the client may not know to look for `?code=` in the URL
2. **No explicit code exchange** -- nowhere in the app calls `supabase.auth.exchangeCodeForSession(code)`, so we rely entirely on auto-detection which is failing silently

## Solution

Two changes:

### 1. `src/integrations/supabase/client.ts` -- Add PKCE flow type

Add `flowType: 'pkce'` and ensure `detectSessionInUrl: true` in the auth config so the client explicitly knows to handle `?code=` parameters:

```ts
auth: {
  storage: safeStorage,
  persistSession: true,
  autoRefreshToken: true,
  flowType: 'pkce',
  detectSessionInUrl: true,
}
```

### 2. `src/App.tsx` -- Explicit code exchange in RootRedirect

Update the `RootRedirect` component to explicitly call `exchangeCodeForSession()` when a `code` parameter is detected, rather than hoping the client auto-detects it:

```ts
function RootRedirect() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const hash = window.location.hash;
  const hasAuthParams = !!code || hash.includes('access_token') || params.has('error');
  
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [exchanging, setExchanging] = useState(false);

  useEffect(() => {
    if (code && !exchanging) {
      setExchanging(true);
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) console.error('Code exchange failed:', error);
        setExchanging(false);
      });
    }
  }, [code]);

  useEffect(() => {
    if (hasAuthParams && !loading && !exchanging) {
      navigate(user ? '/dashboard' : '/quote/motor-selection', { replace: true });
    }
  }, [loading, user, hasAuthParams, navigate, exchanging]);

  if (hasAuthParams) return <RouteLoader />;
  return <Navigate to="/quote/motor-selection" replace />;
}
```

This ensures the code is explicitly exchanged for a session token before any redirect happens. The `AuthProvider`'s `onAuthStateChange` listener will then fire with the new session.
