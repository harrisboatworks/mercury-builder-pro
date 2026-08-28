const FRAGMENT_TOKEN_PATTERN = /^cd_[0-9a-f]{64}$/;

export function parseConsultationFragmentToken(value: string | null | undefined): string | null {
  const token = value?.trim().replace(/^#/, '') || '';
  return FRAGMENT_TOKEN_PATTERN.test(token) ? token.toLowerCase() : null;
}

export function captureConsultationFragmentToken(
  location: Pick<Location, 'hash' | 'pathname' | 'search'> = window.location,
  historyApi: Pick<History, 'replaceState'> = window.history,
): string | null {
  const token = parseConsultationFragmentToken(location.hash);
  historyApi.replaceState(null, '', `${location.pathname}${location.search}`);
  return token;
}
