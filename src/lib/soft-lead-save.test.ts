// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpc, setHeader } = vi.hoisted(() => ({
  rpc: vi.fn(),
  setHeader: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc },
}));

import {
  buildSoftLeadSnapshotKey,
  createSoftLeadSaveCoordinator,
  persistSoftLeadQuote,
} from './soft-lead-save';

describe('persistSoftLeadQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    rpc.mockReturnValue({ setHeader });
  });

  it('changes the persistence key when snapshot facts change but createdAt does not', () => {
    const original = {
      motor: { id: 'motor-1' },
      pdfSnapshot: {
        createdAt: '2026-08-09T12:00:00.000Z',
        pricing: { totalCashPrice: 12_000 },
      },
    };
    const updated = {
      ...original,
      pdfSnapshot: {
        ...original.pdfSnapshot,
        pricing: { totalCashPrice: 13_000 },
      },
    };

    expect(buildSoftLeadSnapshotKey(updated)).not.toBe(buildSoftLeadSnapshotKey(original));
    expect(() => buildSoftLeadSnapshotKey(undefined)).toThrow('JSON-serializable');
  });

  it('reconciles to the latest desired state when a quote reverts during an in-flight write', async () => {
    let resolveMiddleWrite: ((rowId: string) => void) | undefined;
    const persist = vi
      .fn()
      .mockResolvedValueOnce('row-a-1')
      .mockImplementationOnce(() => new Promise<string>((resolve) => {
        resolveMiddleWrite = resolve;
      }))
      .mockResolvedValueOnce('row-a-2');
    const coordinator = createSoftLeadSaveCoordinator({ persist });
    const sessionId = 'qa_0123456789abcdef01234567';
    const stateA = { motor: { id: 'motor-1' }, customerNotes: 'A' };
    const stateB = { motor: { id: 'motor-1' }, customerNotes: 'B' };

    await coordinator.enqueue({
      sessionId,
      quoteState: stateA,
      snapshotKey: buildSoftLeadSnapshotKey(stateA),
    });
    const inFlight = coordinator.enqueue({
      sessionId,
      quoteState: stateB,
      snapshotKey: buildSoftLeadSnapshotKey(stateB),
    });
    void coordinator.enqueue({
      sessionId,
      quoteState: stateA,
      snapshotKey: buildSoftLeadSnapshotKey(stateA),
    });
    resolveMiddleWrite?.('row-b');
    await inFlight;

    expect(persist).toHaveBeenCalledTimes(3);
    expect(persist.mock.calls.map(([input]) => input.quoteState)).toEqual([stateA, stateB, stateA]);
  });

  it('repersists the desired state after an ambiguous in-flight write failure', async () => {
    let rejectMiddleWrite: ((error: Error) => void) | undefined;
    const onError = vi.fn();
    const persist = vi
      .fn()
      .mockResolvedValueOnce('row-a-1')
      .mockImplementationOnce(() => new Promise<string>((_resolve, reject) => {
        rejectMiddleWrite = reject;
      }))
      .mockResolvedValueOnce('row-a-2');
    const coordinator = createSoftLeadSaveCoordinator({ persist, onError });
    const sessionId = 'qa_0123456789abcdef01234567';
    const stateA = { motor: { id: 'motor-1' }, customerNotes: 'A' };
    const stateB = { motor: { id: 'motor-1' }, customerNotes: 'B' };

    await coordinator.enqueue({
      sessionId,
      quoteState: stateA,
      snapshotKey: buildSoftLeadSnapshotKey(stateA),
    });
    const inFlight = coordinator.enqueue({
      sessionId,
      quoteState: stateB,
      snapshotKey: buildSoftLeadSnapshotKey(stateB),
    });
    void coordinator.enqueue({
      sessionId,
      quoteState: stateA,
      snapshotKey: buildSoftLeadSnapshotKey(stateA),
    });
    rejectMiddleWrite?.(new Error('response lost'));
    await inFlight;

    expect(onError).toHaveBeenCalledOnce();
    expect(persist.mock.calls.map(([input]) => input.quoteState)).toEqual([stateA, stateB, stateA]);
  });

  it('makes one delayed reconciliation when the desired state is unchanged after failure', async () => {
    vi.useFakeTimers();
    const failure = new Error('temporary outage');
    const onError = vi.fn();
    const persist = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce('row-a');
    const coordinator = createSoftLeadSaveCoordinator({ persist, onError });
    const stateA = { motor: { id: 'motor-1' }, customerNotes: 'A' };

    const result = coordinator.enqueue({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: stateA,
      snapshotKey: buildSoftLeadSnapshotKey(stateA),
    });
    await vi.advanceTimersByTimeAsync(2_000);
    await result;

    expect(persist).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('bounds delayed reconciliation when an unchanged state stays unavailable', async () => {
    vi.useFakeTimers();
    const failure = new Error('persistent outage');
    const onError = vi.fn();
    const persist = vi.fn().mockRejectedValue(failure);
    const coordinator = createSoftLeadSaveCoordinator({ persist, onError });
    const stateA = { motor: { id: 'motor-1' }, customerNotes: 'A' };

    const result = coordinator.enqueue({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: stateA,
      snapshotKey: buildSoftLeadSnapshotKey(stateA),
    });
    await vi.advanceTimersByTimeAsync(2_000);
    await result;

    expect(persist).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it('uses the atomic soft-lead RPC and returns its canonical row ID', async () => {
    setHeader.mockResolvedValue({ data: '11111111-1111-4111-8111-111111111111', error: null });

    await expect(persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    })).resolves.toBe('11111111-1111-4111-8111-111111111111');

    expect(rpc).toHaveBeenCalledWith('upsert_soft_lead_quote', {
      p_quote_state: { motor: { id: 'motor-1' } },
      p_session_id: 'qa_0123456789abcdef01234567',
    });
    expect(setHeader).toHaveBeenCalledWith(
      'x-quote-session-id',
      'qa_0123456789abcdef01234567',
    );
  });

  it('retries once after a bounded failure', async () => {
    vi.useFakeTimers();
    setHeader
      .mockResolvedValueOnce({ data: null, error: new Error('temporary failure') })
      .mockResolvedValueOnce({ data: '22222222-2222-4222-8222-222222222222', error: null });

    const result = persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    });
    await vi.advanceTimersByTimeAsync(250);

    await expect(result).resolves.toBe('22222222-2222-4222-8222-222222222222');
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(setHeader).toHaveBeenCalledTimes(2);
  });

  it('fails after the bounded retry when persistence remains unavailable', async () => {
    vi.useFakeTimers();
    const failure = new Error('persistent failure');
    setHeader.mockResolvedValue({ data: null, error: failure });

    const result = persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    });
    const expectation = expect(result).rejects.toBe(failure);
    await vi.advanceTimersByTimeAsync(250);

    await expectation;
    expect(rpc).toHaveBeenCalledTimes(2);
  });

  it('rejects a malformed success payload instead of treating it as persisted', async () => {
    vi.useFakeTimers();
    setHeader.mockResolvedValue({ data: 'not-a-uuid', error: null });

    const result = persistSoftLeadQuote({
      sessionId: 'qa_0123456789abcdef01234567',
      quoteState: { motor: { id: 'motor-1' } },
    });
    const expectation = expect(result).rejects.toThrow('no valid row ID');
    await vi.advanceTimersByTimeAsync(250);

    await expectation;
    expect(rpc).toHaveBeenCalledTimes(2);
  });
});
