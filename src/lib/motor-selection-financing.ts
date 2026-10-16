import { formatPromoCalendarDate, promoEndOfDay } from '../../supabase/functions/_shared/promo-dates';

/** Label only the standing TD offer used by the card estimates, never Chase financing. */
export function formatStandingTdExpiry(
  offer: { name: string; rate: number; promo_end_date?: string | null } | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!offer || !/\bTD\b.*\bAlways\s+On\b/i.test(offer.name)
    || !Number.isFinite(offer.rate) || offer.rate < 0 || !offer.promo_end_date) {
    return null;
  }
  const expiry = promoEndOfDay(offer.promo_end_date);
  if (!Number.isFinite(expiry.getTime()) || expiry < now) return null;
  const date = formatPromoCalendarDate(offer.promo_end_date);
  return date ? `TD Auto Finance offer available through ${date} (OAC).` : null;
}
