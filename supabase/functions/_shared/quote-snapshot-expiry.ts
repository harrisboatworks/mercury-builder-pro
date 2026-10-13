import { promoEndOfDay } from './promo-dates.ts';

export interface QuoteSnapshotValidity {
  validUntil?: string | null;
  promotion?: { endDate?: string | null } | null;
}

/** Historical records remain readable; new quote actions must respect both deadlines. */
export function isQuoteSnapshotExpired(snapshot: QuoteSnapshotValidity, now = new Date()): boolean {
  const deadlines: Date[] = [];
  if (snapshot.validUntil) {
    deadlines.push(/^\d{4}-\d{2}-\d{2}$/.test(snapshot.validUntil)
      ? promoEndOfDay(snapshot.validUntil) : new Date(snapshot.validUntil));
  }
  if (snapshot.promotion?.endDate) deadlines.push(promoEndOfDay(snapshot.promotion.endDate));
  return deadlines.some(deadline => !Number.isFinite(deadline.getTime()) || deadline < now);
}
