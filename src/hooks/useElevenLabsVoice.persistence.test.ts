import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  callbacks: {} as {onConnect: () => void; onDisconnect: () => void; onMessage: (message: unknown) => void},
  transportEnd: vi.fn(), start: vi.fn(), end: vi.fn(), increment: vi.fn(), toast: vi.fn(),
}));
vi.mock('@elevenlabs/react', () => ({
  useConversation: (callbacks: typeof mock.callbacks) => {
    mock.callbacks = callbacks;
    return {status: 'disconnected', isSpeaking: false, endSession: mock.transportEnd};
  },
}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {}}));
vi.mock('@/hooks/use-toast', () => ({useToast: () => ({toast: mock.toast})}));
vi.mock('./useVoiceSessionPersistence', () => ({useVoiceSessionPersistence: () => ({
  startSession: mock.start, endSession: mock.end, incrementMessageCount: mock.increment,
})}));
import { useElevenLabsVoice } from './useElevenLabsVoice';

beforeEach(() => {
  vi.clearAllMocks();
  mock.start.mockReturnValue(new Promise(() => {}));
  mock.end.mockReturnValue(new Promise(() => {}));
  mock.transportEnd.mockResolvedValue(undefined);
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('provider connection and persistence', () => {
  it('records only after the provider connects and does not wait for the write', () => {
    const motor = {model: '90 ELPT', hp: 90};
    const {result} = renderHook(() => useElevenLabsVoice({motorContext: motor, currentPage: '/'}));
    expect(mock.start).not.toHaveBeenCalled();
    act(() => mock.callbacks.onConnect());
    expect(mock.start).toHaveBeenCalledWith(motor, '/');
    expect(result.current.isConnected).toBe(true);
    act(() => mock.callbacks.onDisconnect());
    expect(mock.end).toHaveBeenCalledWith('error');
    expect(result.current.isConnected).toBe(false);
  });
  it('stops the provider immediately while completion recording is pending', async () => {
    const {result} = renderHook(() => useElevenLabsVoice());
    await act(async () => {await result.current.endVoiceChat('user_ended');});
    expect(mock.end).toHaveBeenCalledWith('user_ended');
    expect(mock.transportEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isConnected).toBe(false);
  });
  it('counts agent replies in the normalized message shape delivered by the installed SDK', () => {
    renderHook(() => useElevenLabsVoice());
    act(() => mock.callbacks.onMessage({source: 'ai', role: 'agent', message: 'Hello from this synthetic check.'}));
    expect(mock.increment).toHaveBeenCalledTimes(1);
    act(() => mock.callbacks.onMessage({type: 'vad_score', vad_score_event: {vad_score: 0.1}}));
    expect(mock.increment).toHaveBeenCalledTimes(1);
  });
});
