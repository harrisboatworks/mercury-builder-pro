// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const analytics = vi.hoisted(() => ({
  getDeviceType: vi.fn(() => 'desktop'),
  getPageCategory: vi.fn(() => 'blog'),
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/analytics', () => analytics);

import { BoatingCardHelp } from './BoatingCardHelp';

describe('BoatingCardHelp', () => {
  const writeText = vi.fn(() => Promise.resolve());

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/blog/boat-rental-licence-ontario-guide');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  it('presents the HBW policy as help and marks the partner link as sponsored', () => {
    render(<BoatingCardHelp variant="full" />);

    expect(screen.getByText(/HBW requires every rental driver/i)).toBeInTheDocument();
    expect(screen.getByText('HARRIS15')).toBeInTheDocument();

    const partnerLink = screen.getByRole('link', { name: /get your operator card/i });
    expect(partnerLink).toHaveAttribute('href', 'https://myboatcard.com/card/harrisboat');
    expect(partnerLink).toHaveAttribute('rel', expect.stringContaining('sponsored'));

    fireEvent.click(partnerLink);
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      'partner_referral_click',
      expect.objectContaining({
        partner: 'myboatcard',
        entry_page: '/blog/boat-rental-licence-ontario-guide',
        entry_cta: 'blog_boating_card_full',
      }),
    );
  });

  it('copies the partner code and records the copy event', async () => {
    render(<BoatingCardHelp />);

    fireEvent.click(screen.getByRole('button', { name: /copy discount code HARRIS15/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('HARRIS15'));
    expect(await screen.findByText('Discount code copied')).toBeInTheDocument();
    expect(analytics.trackEvent).toHaveBeenCalledWith(
      'partner_code_copy',
      expect.objectContaining({ entry_cta: 'blog_boating_card_compact' }),
    );
  });
});
