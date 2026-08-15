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

  it('maps only known quote and financing steps to stable labels', async () => {
    const { getFinancingFunnelStep, getQuoteFunnelStep } = await import('./analytics');

    expect(getQuoteFunnelStep('/quote/motor-selection/')).toBe('motor-selection');
    expect(getQuoteFunnelStep('/quote/summary')).toBe('summary');
    expect(getQuoteFunnelStep('/quote/saved/customer-id')).toBeNull();
    expect(getFinancingFunnelStep(6)).toBe('references');
    expect(getFinancingFunnelStep(99)).toBeNull();
  });

  it('queues privacy-safe funnel tags and an event only after consent', async () => {
    const { setConsent, trackClarityFunnelStep } = await import('./analytics');

    expect(trackClarityFunnelStep('quote', 'motor-selection')).toBe(false);
    expect(window.clarity).toBeUndefined();

    setConsent('granted');
    expect(trackClarityFunnelStep('quote', 'motor-selection')).toBe(true);
    expect(window.clarity?.q).toContainEqual(['set', 'funnel', 'quote']);
    expect(window.clarity?.q).toContainEqual(['set', 'funnel_step', 'quote:motor-selection']);
    expect(window.clarity?.q).toContainEqual(['event', 'quote_step_view']);
  });

  it('replays the current funnel step when a visitor grants consent in place', async () => {
    const {
      setConsent,
      syncClarityConsent,
      trackClarityFunnelStep,
    } = await import('./analytics');

    expect(trackClarityFunnelStep('quote', 'motor-selection')).toBe(false);

    setConsent('granted');
    syncClarityConsent('granted');

    expect(window.clarity?.q).toContainEqual(['set', 'funnel', 'quote']);
    expect(window.clarity?.q).toContainEqual([
      'set',
      'funnel_step',
      'quote:motor-selection',
    ]);
    expect(window.clarity?.q).toContainEqual(['event', 'quote_step_view']);
  });

  it('does not retain a pending funnel step after consent is denied', async () => {
    const {
      setConsent,
      syncClarityConsent,
      trackClarityFunnelStep,
    } = await import('./analytics');

    expect(trackClarityFunnelStep('financing', 'purchase-details')).toBe(false);

    setConsent('denied');
    syncClarityConsent('denied');
    setConsent('granted');
    syncClarityConsent('granted');

    expect(window.clarity?.q).not.toContainEqual([
      'set',
      'funnel_step',
      'financing:purchase-details',
    ]);
  });

  it('sanitizes catalog labels and never accepts arbitrary motor metadata', async () => {
    const { setConsent, trackClarityMotorSelection } = await import('./analytics');

    setConsent('granted');
    expect(trackClarityMotorSelection({
      model: '115 Pro XS <script>alert(1)</script>',
      hp: 115,
      family: 'Pro XS',
    })).toBe(true);

    expect(window.clarity?.q).toContainEqual([
      'set',
      'motor_model',
      '115 Pro XS scriptalert(1)/script',
    ]);
    expect(window.clarity?.q).toContainEqual(['set', 'motor_hp', '115']);
    expect(window.clarity?.q).toContainEqual(['set', 'motor_family', 'Pro XS']);
    expect(window.clarity?.q).toContainEqual(['event', 'quote_motor_selected']);
  });

  it('records only fixed validation and submission categories', async () => {
    const {
      setConsent,
      trackClaritySubmission,
      trackClarityValidationBlocked,
    } = await import('./analytics');

    setConsent('granted');
    trackClarityValidationBlocked('financing', 'references_incomplete');
    trackClaritySubmission('financing');

    expect(window.clarity?.q).toContainEqual([
      'set',
      'validation_error',
      'references_incomplete',
    ]);
    expect(window.clarity?.q).toContainEqual(['event', 'financing_validation_blocked']);
    expect(window.clarity?.q).toContainEqual(['set', 'funnel_status', 'submitted']);
    expect(window.clarity?.q).toContainEqual(['event', 'financing_submitted']);
  });
});
