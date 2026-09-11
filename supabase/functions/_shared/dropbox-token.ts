interface DropboxStoredToken {
  access_token?: string | null;
  refresh_token?: string | null;
  token_type?: string | null;
  expires_at?: string | null;
  scope?: string | null;
  account_id?: string | null;
  connected_by?: string | null;
  connected_at?: string | null;
}

interface DropboxTokenClient {
  rpc: (name: string, params?: Record<string, unknown>) => PromiseLike<{
    data: unknown;
    error: { message?: string } | null;
  }>;
}

const TOKEN_EXPIRY_SKEW_MS = 60_000;

function readDenoEnv(name: string): string {
  const runtime = globalThis as typeof globalThis & {
    Deno?: { env: { get: (key: string) => string | undefined } };
  };
  return runtime.Deno?.env.get(name) || "";
}

export function isDropboxAccessTokenFresh(
  token: DropboxStoredToken | null | undefined,
  now = Date.now(),
): boolean {
  if (!token?.access_token) return false;
  if (!token.expires_at) return true;
  const expiresAt = Date.parse(token.expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now + TOKEN_EXPIRY_SKEW_MS;
}

async function refreshDropboxToken(
  supabase: DropboxTokenClient,
  token: DropboxStoredToken,
): Promise<DropboxStoredToken | null> {
  const appKey = readDenoEnv("DROPBOX_APP_KEY");
  const appSecret = readDenoEnv("DROPBOX_APP_SECRET");
  if (!token.refresh_token || !appKey || !appSecret) return null;

  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${btoa(`${appKey}:${appSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
    }),
  });
  if (!response.ok) {
    console.error("Dropbox token refresh failed with status", response.status);
    return null;
  }

  const refreshed = await response.json() as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  };
  if (!refreshed.access_token) return null;

  const nextToken: DropboxStoredToken = {
    ...token,
    access_token: refreshed.access_token,
    token_type: refreshed.token_type || token.token_type || "bearer",
    expires_at: refreshed.expires_in
      ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
      : null,
    scope: refreshed.scope || token.scope || null,
  };
  const { error } = await supabase.rpc("store_dropbox_oauth_token", { p_token: nextToken });
  if (error) {
    console.error("Refreshed Dropbox token could not be stored:", error.message || "unknown error");
    return null;
  }
  return nextToken;
}

export async function getDropboxAccessToken(
  supabase: DropboxTokenClient,
): Promise<{ accessToken: string | null; expiresAt: string | null }> {
  const { data, error } = await supabase.rpc("get_dropbox_oauth_token");
  const storedToken = data as DropboxStoredToken | null;
  if (error) console.warn("Dropbox Vault token lookup failed:", error.message || "unknown error");

  if (isDropboxAccessTokenFresh(storedToken)) {
    return { accessToken: storedToken!.access_token!, expiresAt: storedToken!.expires_at || null };
  }
  if (storedToken?.refresh_token) {
    const refreshed = await refreshDropboxToken(supabase, storedToken);
    if (refreshed?.access_token) {
      return { accessToken: refreshed.access_token, expiresAt: refreshed.expires_at || null };
    }
  }

  return { accessToken: readDenoEnv("DROPBOX_ACCESS_TOKEN") || null, expiresAt: null };
}
