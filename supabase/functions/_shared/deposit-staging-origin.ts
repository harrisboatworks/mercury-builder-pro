// Pure, testable exact-origin exception for the already-approved isolated
// deposit sandbox. Production projects cannot enable it by setting a flag.
export function resolveDepositStagingOrigin(raw: string | null | undefined, env: {
  DEPOSIT_STAGING_MODE?: string; SUPABASE_URL?: string; NATIVE_DEPOSIT_REVIEW_ORIGIN?: string;
}): string | null {
  if (!raw || env.DEPOSIT_STAGING_MODE !== '1' || env.SUPABASE_URL !== 'https://filwwwqgqtwxjxkksmxy.supabase.co'
    || raw !== env.NATIVE_DEPOSIT_REVIEW_ORIGIN) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.origin === raw && !url.username && !url.password ? raw : null;
  } catch { return null; }
}
