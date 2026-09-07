// @vitest-environment-options {"url":"https://mercury-builder-pro-git-fix-consultation-quote-display-hbw.vercel.app/login"}
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';

const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: {
    signInWithOAuth,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({ data: { session: null } }),
  } },
}));
vi.mock('@/components/ErrorBoundary', () => ({ ErrorBoundary: ({ children }: any) => children }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('AuthProvider preview OAuth wiring', () => {
  it.each(['google', 'facebook'] as const)('sends the exact preview callback to %s', async (provider) => {
    let auth!: ReturnType<typeof useAuth>;
    function Consumer() { auth = useAuth(); return null; }
    await act(async () => { render(<AuthProvider><Consumer /></AuthProvider>); });
    const signIn = provider === 'google' ? auth.signInWithGoogle : auth.signInWithFacebook;
    await act(async () => { await signIn(); });
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider,
      options: { redirectTo: 'https://mercury-builder-pro-git-fix-consultation-quote-display-hbw.vercel.app/' },
    });
    const explicit = 'https://www.mercuryrepower.ca/quote/success?ref=TEST';
    await act(async () => { await signIn(explicit); });
    expect(signInWithOAuth).toHaveBeenLastCalledWith({ provider, options: { redirectTo: explicit } });
  });
});
