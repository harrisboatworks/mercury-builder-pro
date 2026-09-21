import { useEffect, useState } from 'react';
import {
  getStoredConsent,
  pushConsentDefault,
  pushConsentUpdate,
  setConsent,
  syncClarityConsent,
} from '@/lib/analytics';

/**
 * PIPEDA-friendly Consent Mode v2 banner.
 * - On first visit: pushes consent_default (all denied) and shows banner.
 * - On accept/decline: writes mr_consent cookie (180d) and pushes consent_update.
 * - On return visit: replays stored consent_update without showing banner.
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      pushConsentUpdate(stored);
      syncClarityConsent(stored);
    } else {
      pushConsentDefault();
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const choose = (value: 'granted' | 'denied') => {
    setConsent(value);
    syncClarityConsent(value);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[80] border-t border-[#20384d]/20 bg-white shadow-[0_-4px_20px_rgba(32,56,77,0.08)]"
    >
      <div className="mx-auto flex max-w-[1400px] flex-row items-center justify-between gap-2 px-3 py-2 md:gap-6 md:px-8 md:py-4">
        <p className="m-0 block text-[13px] leading-none text-[#20384d] whitespace-nowrap md:hidden">
          We use analytics cookies.{' '}
          <a
            href="/privacy"
            className="underline decoration-[#20384d]/40 underline-offset-2 hover:decoration-[#20384d]"
          >
            Privacy
          </a>
        </p>
        <p className="m-0 hidden text-sm leading-snug text-[#20384d] md:block">
          We use cookies to understand site traffic and improve mercuryrepower.ca.
          You can accept or decline analytics cookies.{' '}
          <a
            href="/privacy"
            className="underline decoration-[#20384d]/40 underline-offset-2 hover:decoration-[#20384d]"
          >
            Privacy
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="h-10 rounded-md border border-[#20384d]/30 bg-white px-2 text-[13px] font-medium text-[#20384d] transition-colors hover:bg-[#20384d]/5 md:h-auto md:px-4 md:py-2 md:text-sm"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="h-10 rounded-md bg-[#20384d] px-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#2a4660] md:h-auto md:px-4 md:py-2 md:text-sm"
          >
            Accept
          </button>
          <button
            type="button"
            aria-label="Dismiss cookie banner (declines analytics cookies)"
            onClick={() => choose('denied')}
            className="ml-1 hidden rounded-md p-2 text-lg leading-none text-[#20384d]/60 transition-colors hover:bg-[#20384d]/5 hover:text-[#20384d] md:inline-flex"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  );
}
