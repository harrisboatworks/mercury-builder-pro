import { describe, expect, it, vi } from 'vitest';
import {
  prepareMotorReservationIntent, runMotorReservationPreparation,
  MOTOR_RESERVATION_PREPARATION_OUTPUT_SCHEMA,
} from '../../../supabase/functions/_shared/motor-reservation-intent.ts';
import { EXPRESS_MOTOR_ID, EXPRESS_MOTOR_MODEL_NUMBER } from '../../../supabase/functions/_shared/deposit-policy.ts';

const NOW = new Date('2026-10-12T12:00:00Z');
const ID = 'chk_synthetic_reservation';
const MOTOR = {
  id: '11111111-1111-4111-8111-111111111111', model: '90 ELPT FourStroke',
  model_number: 'synthetic', horsepower: 90, sale_price: 14000, availability: null,
  stock_quantity: 0, in_stock: false,
};
const SESSION = {
  id: ID, status: 'requires_escalation', currency: 'CAD', expires_at: '2026-10-12T18:00:00Z',
  line_items: [{ item: { id: MOTOR.id, price: 1400000 }, quantity: 1 }],
  totals: [{ type: 'total', amount: 1582000 }],
  buyer: { email: 'synthetic@example.invalid' },
};
const CALLER = { id: ID, operation: 'motor_reservation' };
function prepare(session = SESSION, motor = MOTOR, caller: unknown = CALLER) {
  return prepareMotorReservationIntent({ persistedSession: session, serverLoadedMotor: motor, caller, now: NOW });
}

describe('explicit reservation preparation', () => {
  it('returns policy deposit cents rather than merchandise/HST totals; never returns buyer data', () => {
    const original = structuredClone(SESSION);
    const result = prepare();
    expect(result).toMatchObject({ ok: true, preparation: {
      amount_cents: 50000, currency: 'CAD', payment_status: 'not_started', status: 'requires_escalation',
      operation: 'motor_reservation', terms_url: 'https://www.mercuryrepower.ca/terms',
    } });
    if (!result.ok) throw Error('Expected estimate');
    expect(Object.keys(result.preparation).sort()).toEqual([...MOTOR_RESERVATION_PREPARATION_OUTPUT_SCHEMA.required].sort());
    const url = new URL(result.preparation.continue_url);
    expect(Object.fromEntries(url.searchParams)).toEqual({ ucp: ID, motor: MOTOR.id, reservation: '1' });
    expect(JSON.stringify(result)).not.toContain('synthetic@example.invalid');
    expect(SESSION).toEqual(original);
  });

  it.each([[9.9, 20000], [25, 20000], [26, 50000], [115, 50000], [116, 100000]])(
    'derives %s HP deposit from trusted catalog', (horsepower, amount_cents) => {
      expect(prepare(SESSION, { ...MOTOR, horsepower })).toMatchObject({ ok: true, preparation: { amount_cents } });
    },
  );

  it('allows the express tier only for the exact catalog id plus model number', () => {
    const session = { ...SESSION, line_items: [{ item: { id: EXPRESS_MOTOR_ID, price: 320000 }, quantity: 1 }] };
    const motor = { ...MOTOR, id: EXPRESS_MOTOR_ID, model_number: EXPRESS_MOTOR_MODEL_NUMBER, horsepower: 9.9, sale_price: 3200 };
    expect(prepare(session, motor)).toMatchObject({ ok: true, preparation: { amount_cents: 10000 } });
    expect(prepare(session, { ...motor, model_number: 'different' })).toMatchObject({ ok: true, preparation: { amount_cents: 20000 } });
  });

  it.each(['payment', 'shared_payment_token', 'amount_cents', 'contact', 'email', 'express', 'currency', 'motor_id', 'terms_version'])(
    'rejects caller %s before either database read', async (key) => {
      const io = { loadSession: vi.fn(), loadMotor: vi.fn() };
      expect(await runMotorReservationPreparation({ caller: { ...CALLER, [key]: 'ignored' }, io, now: NOW }))
        .toMatchObject({ ok: false, code: 'invalid_request' });
      expect(io.loadSession).not.toHaveBeenCalled();
      expect(io.loadMotor).not.toHaveBeenCalled();
    },
  );

  it('supports route-bound REST and transport-only MCP metadata, rejecting disagreement/nested payment', async () => {
    const io = { loadSession: vi.fn().mockResolvedValue(SESSION), loadMotor: vi.fn().mockResolvedValue(MOTOR) };
    expect(await runMotorReservationPreparation({ caller: { operation: 'motor_reservation' }, routeSessionId: ID, io, now: NOW })).toMatchObject({ ok: true });
    expect(prepare(SESSION, MOTOR, { ...CALLER, meta: { 'ucp-agent': { profile: 'https://example.invalid/profile' } } })).toMatchObject({ ok: true });
    expect(prepare(SESSION, MOTOR, { ...CALLER, meta: { payment: 'spt_synthetic' } })).toMatchObject({ ok: false });
    expect(await runMotorReservationPreparation({ caller: CALLER, routeSessionId: 'other', io, now: NOW })).toMatchObject({ ok: false });
    expect(prepare(SESSION, MOTOR, { id: ID })).toMatchObject({ ok: false, code: 'invalid_operation' });
  });

  it.each(['completed', 'canceled', 'incomplete'])('rejects non-active %s sessions', (status) => {
    expect(prepare({ ...SESSION, status })).toMatchObject({ ok: false });
  });
  it.each(['2026-10-12T12:00:00Z', '2026-10-11T18:00:00Z', 'invalid', ''])('rejects expired/invalid expiry %s', (expires_at) => {
    expect(prepare({ ...SESSION, expires_at })).toMatchObject({ ok: false, code: 'session_expired' });
  });
  it('rejects multi-motor, quantity, non-CAD and partially resolved quotes', () => {
    expect(prepare({ ...SESSION, line_items: [...SESSION.line_items, ...SESSION.line_items] })).toMatchObject({ ok: false });
    for (const quantity of [0, 2, 1.5, '1']) {
      expect(prepare({ ...SESSION, line_items: [{ ...SESSION.line_items[0], quantity }] } as typeof SESSION)).toMatchObject({ ok: false });
    }
    expect(prepare({ ...SESSION, currency: 'USD' })).toMatchObject({ ok: false, code: 'invalid_currency' });
    expect(prepare({ ...SESSION, messages: [{ code: 'item_not_found', severity: 'requires_buyer_input' }] } as typeof SESSION)).toMatchObject({ ok: false, code: 'quote_incomplete' });
  });
  it('rejects price drift, excluded, unpriced, Verado, invalid HP, and deposit >= merchandise', () => {
    expect(prepare(SESSION, { ...MOTOR, sale_price: 14500 })).toMatchObject({ ok: false, code: 'stale_motor' });
    expect(prepare(SESSION, { ...MOTOR, availability: 'Exclude' })).toMatchObject({ ok: false, code: 'motor_unavailable' });
    expect(prepare(SESSION, { ...MOTOR, sale_price: NaN })).toMatchObject({ ok: false, code: 'price_unavailable' });
    expect(prepare(SESSION, { ...MOTOR, model: 'Verado' })).toMatchObject({ ok: false, code: 'special_order_only' });
    expect(prepare(SESSION, { ...MOTOR, horsepower: NaN })).toMatchObject({ ok: false });
    expect(prepare({ ...SESSION, line_items: [{ item: { id: MOTOR.id, price: 50000 }, quantity: 1 }] }, { ...MOTOR, sale_price: 500 })).toMatchObject({ ok: false, code: 'deposit_exceeds_merchandise' });
  });
  it('only performs two reads for a valid preparation and projects no payment instrument', async () => {
    const io = { loadSession: vi.fn().mockResolvedValue(SESSION), loadMotor: vi.fn().mockResolvedValue(MOTOR) };
    expect(await runMotorReservationPreparation({ caller: CALLER, io, now: NOW })).toMatchObject({ ok: true });
    expect(io.loadSession).toHaveBeenCalledExactlyOnceWith(ID);
    expect(io.loadMotor).toHaveBeenCalledExactlyOnceWith(MOTOR.id);
    expect(prepare({ ...SESSION, payment: { token: 'spt_synthetic' } } as typeof SESSION)).toMatchObject({ ok: false });
  });
});
