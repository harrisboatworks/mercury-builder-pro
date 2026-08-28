/**
 * Layout helpers for the global AI chat launcher and mobile drawer.
 *
 * The old UnifiedMobileBar is gone. Quote pages still have a full-width
 * sticky Continue bar (~152px via QuoteStepNav). The launcher must sit
 * above that bar on phones; the open drawer covers it.
 */

export function isPhoneQuoteNavPath(pathname: string): boolean {
  return pathname === '/quote' || pathname.startsWith('/quote/') || pathname === '/promotions';
}

/** Stable page bucket used to decide when persisted chat context must reset. */
export function getChatPageCategory(pathname: string): string {
  if (pathname.startsWith('/repower')) return 'repower';
  if (pathname === '/quote' || pathname.startsWith('/quote/')) return 'quote';
  if (pathname.startsWith('/financing')) return 'financing';
  if (pathname.startsWith('/promotions')) return 'promotions';
  if (pathname.startsWith('/contact')) return 'contact';
  return 'general';
}

/** CSS bottom offset for the floating launcher on phones. */
export function getMobileLauncherBottom(pathname: string): string {
  if (isPhoneQuoteNavPath(pathname)) {
    return 'calc(10.5rem + env(safe-area-inset-bottom, 0px))';
  }
  return 'calc(1rem + env(safe-area-inset-bottom, 0px))';
}

/** CSS bottom offset for the mobile drawer when the keyboard is closed. */
export function getMobileDrawerBottom(): string {
  return '0px';
}
