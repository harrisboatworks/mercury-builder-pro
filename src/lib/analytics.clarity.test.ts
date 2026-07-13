import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearConsent = () => {
  document.cookie = 'mr_consent=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.querySelectorAll('script[data-clarity-project-id]').forEach((script) => script.remove());
  delete window.clarity;
  window.dataLayer = [];
};

describe('Microsoft Clarity consent gate', () => {
  beforeEach(() => {
    vi.resetModules();
    clearConsent();
  });

  it('does not load Clarity before a consent decision', async () => {
    const { loadClarityAfterConsent } = await import('./analytics');

    expect(loadClarityAfterConsent()).toBe(false);
    expect(document.querySelector('script[src*="clarity.ms/tag/"]')).toBeNull();
    expect(window.clarity).toBeUndefined();
  });

  it('does not load Clarity when analytics consent is denied', async () => {
    const { setConsent, syncClarityConsent } = await import('./analytics');

    setConsent('denied');
    syncClarityConsent('denied');

    expect(document.querySelector('script[src*="clarity.ms/tag/"]')).toBeNull();
    expect(window.clarity).toBeUndefined();
  });

  it('queues Consent API v2 and loads the project tag after acceptance', async () => {
    const { CLARITY_PROJECT_ID, setConsent, syncClarityConsent } = await import('./analytics');

    setConsent('granted');
    syncClarityConsent('granted');

    const script = document.querySelector<HTMLScriptElement>(
      `script[data-clarity-project-id="${CLARITY_PROJECT_ID}"]`,
    );
    expect(script?.src).toBe(`https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`);
    expect(window.clarity?.q).toContainEqual([
      'consentv2',
      { ad_Storage: 'denied', analytics_Storage: 'granted' },
    ]);
  });

  it('adds the Clarity tag only once on repeat initialization', async () => {
    const { setConsent, syncClarityConsent } = await import('./analytics');

    setConsent('granted');
    syncClarityConsent('granted');
    syncClarityConsent('granted');

    expect(document.querySelectorAll('script[data-clarity-project-id]')).toHaveLength(1);
  });
});
