import { describe, expect, it } from 'vitest';

import {
  CONSULTATION_SAVED_QUOTE_SOURCE,
  buildConsultationSavedQuoteState,
  consultationSnapshotFromAuthoritativeQuote,
} from '../../../supabase/functions/_shared/consultation-authoritative-quote.ts';
import { consultationSubmitDeliverySnapshot } from '../../../supabase/functions/_shared/consultation-document-policy.ts';

const QUOTE_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const SNAPSHOT = consultationSubmitDeliverySnapshot({
  customerName: 'Jay Harris',
  customerEmail: 'jay@example.com',
  customerPhone: '+19053766208',
  motorModel: 'Mercury 150 FourStroke',
  totalPrice: 18450,
});

describe('authoritative consultation saved quote', () => {
  it('builds a server-owned snapshot and remints from the persisted row, not a caller email', () => {
    const state = buildConsultationSavedQuoteState({
      quoteNumber: 'HBW-123456',
      quoteId: QUOTE_ID,
      snapshot: SNAPSHOT,
    });
    expect(state.source).toBe(CONSULTATION_SAVED_QUOTE_SOURCE);
    expect(state.customerQuoteId).toBe(QUOTE_ID);
    expect(state.motor).toEqual({ model: 'Mercury 150 FourStroke' });

    const minted = consultationSnapshotFromAuthoritativeQuote({
      persistedName: 'Jay Harris',
      persistedEmail: 'owner@example.com',
      persistedPhone: '+19053766208',
      quoteState: {
        ...state,
        customer: { ...SNAPSHOT, customerEmail: 'attacker@example.com' },
      },
      fallbackMotor: 'ignored',
      fallbackTotal: 1,
    });
    expect(minted.customerEmail).toBe('owner@example.com');
    expect(minted.motorModel).toBe('Mercury 150 FourStroke');
    expect(minted.totalPrice).toBe(18450);
  });
});
