// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({
  ensureQuoteId: vi.fn(),
  getDeviceType: vi.fn(() => 'desktop'),
  getPageCategory: vi.fn(() => 'money'),
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/analytics', () => analytics);

import { GlobalCtaTracker } from './GlobalCtaTracker';

describe('GlobalCtaTracker customer handoffs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/pricing-reference');
  });

  it('tracks an untagged phone link without sending the phone number', () => {
    render(
      <>
        <GlobalCtaTracker />
        <a href="tel:+19053422153" onClick={(event) => event.preventDefault()}>Call us</a>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Call us' }));

    expect(analytics.trackEvent).toHaveBeenCalledWith('phone_click', {
      entry_page: '/pricing-reference',
      page_category: 'money',
      device_type: 'desktop',
      entry_cta: 'untagged_phone_link',
    });
    expect(JSON.stringify(analytics.trackEvent.mock.calls)).not.toContain('19053422153');
  });

  it('preserves a supplied location for phone attribution', () => {
    render(
      <>
        <GlobalCtaTracker />
        <a href="tel:+19053422153" data-cta-location="pricing_banner_phone" onClick={(event) => event.preventDefault()}>
          Call from banner
        </a>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Call from banner' }));

    expect(analytics.trackEvent).toHaveBeenCalledWith(
      'phone_click',
      expect.objectContaining({ entry_cta: 'pricing_banner_phone' }),
    );
  });

  it('tracks an untagged text-message handoff separately', () => {
    render(
      <>
        <GlobalCtaTracker />
        <a href="sms:+12897693111" onClick={(event) => event.preventDefault()}>Text us</a>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Text us' }));

    expect(analytics.trackEvent).toHaveBeenCalledWith('sms_click', {
      entry_page: '/pricing-reference',
      page_category: 'money',
      device_type: 'desktop',
      entry_cta: 'untagged_sms_link',
    });
    expect(JSON.stringify(analytics.trackEvent.mock.calls)).not.toContain('12897693111');
  });

  it('tracks an untagged email handoff and ignores ordinary links', () => {
    render(
      <>
        <GlobalCtaTracker />
        <a href="mailto:sales@example.test" onClick={(event) => event.preventDefault()}>Email us</a>
        <a href="/quote/motor-selection" onClick={(event) => event.preventDefault()}>Browse motors</a>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Email us' }));
    fireEvent.click(screen.getByRole('link', { name: 'Browse motors' }));

    expect(analytics.trackEvent).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith('email_click', {
      entry_page: '/pricing-reference',
      page_category: 'money',
      device_type: 'desktop',
      entry_cta: 'untagged_email_link',
    });
    expect(JSON.stringify(analytics.trackEvent.mock.calls)).not.toContain('sales@example.test');
  });
});
