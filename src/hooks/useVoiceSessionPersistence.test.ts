import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

const mock = vi.hoisted(() => ({ getUser: vi.fn(), invoke: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({supabase: {auth: {getUser: mock.getUser}, functions: {invoke: mock.invoke}, from: mock.from}}));
import { useVoiceSessionPersistence } from './useVoiceSessionPersistence';
const id = '11111111-1111-4111-8111-111111111111';
const otherId = '22222222-2222-4222-8222-222222222222';
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(r => {resolve = r;});
  return {promise, resolve};
}
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  mock.getUser.mockResolvedValue({data: {user: null}});
  mock.invoke.mockImplementation(async (_name: string, {body}: {body: {action: string}}) =>
    body.action === 'create' ? {data: {id}, error: null} : {data: {success: true}, error: null});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('voice session persistence lifecycle', () => {
  it('creates anonymous sessions via the proxy and preserves text storage', async () => {
    const chat = 'chat_' + 'd'.repeat(64);
    localStorage.setItem('chat_session_id', chat);
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {expect(await result.current.startSession({model: '90 ELPT', hp: 90}, '/')).toBe(id);});
    const body = mock.invoke.mock.calls[0][1].body;
    expect(body).toMatchObject({action: 'create', page: '/', motor_context: {model: '90 ELPT', hp: 90}});
    expect(body.session_id).toMatch(/^voice_[a-f0-9]{32}$/);
    expect(body).not.toHaveProperty('conversation_id');
    expect(mock.from).not.toHaveBeenCalled();
    expect(localStorage.getItem('chat_session_id')).toBe(chat);
  });
  it('counts early messages and closes a session when its create response arrives after disconnect', async () => {
    const pending = deferred<{data: {id: string}, error: null}>();
    mock.invoke.mockImplementation((_name: string, {body}: {body: {action: string}}) =>
      body.action === 'create' ? pending.promise : Promise.resolve({data: {success: true}, error: null}));
    const {result} = renderHook(() => useVoiceSessionPersistence());
    const oldEnd = result.current.endSession;
    let start!: Promise<string | null>; let end!: Promise<void>;
    act(() => {
      start = result.current.startSession();
      result.current.incrementMessageCount();
      result.current.incrementMessageCount();
    });
    await waitFor(() => expect(mock.invoke).toHaveBeenCalledTimes(1));
    act(() => {end = oldEnd('user_ended');});
    await act(async () => {
      pending.resolve({data: {id}, error: null});
      await start; await end; await result.current.endSession('error');
    });
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    expect(mock.invoke.mock.calls[1][1].body).toMatchObject({action: 'update', record_id: id,
      updates: {messages_exchanged: 2, end_reason: 'user_ended'}});
    expect(result.current.currentSessionId).toBeNull();
  });
  it('deduplicates connection callbacks while creation is pending', async () => {
    const pending = deferred<{data: {id: string}, error: null}>();
    mock.invoke.mockReturnValue(pending.promise);
    const {result} = renderHook(() => useVoiceSessionPersistence());
    let a!: Promise<string | null>; let b!: Promise<string | null>;
    act(() => {a = result.current.startSession(); b = result.current.startSession();});
    await act(async () => {pending.resolve({data: {id}, error: null}); await a; await b;});
    expect(mock.invoke).toHaveBeenCalledTimes(1);
    expect(result.current.currentSessionId).toBe(id);
  });
  it('does not let a late completion overwrite a newer active session', async () => {
    const pending = deferred<{data: {id: string}, error: null}>();
    let creates = 0;
    mock.invoke.mockImplementation((_name: string, {body}: {body: {action: string}}) => {
      if (body.action === 'create') return ++creates === 1 ? pending.promise : Promise.resolve({data: {id: otherId}, error: null});
      return Promise.resolve({data: {success: true}, error: null});
    });
    const {result} = renderHook(() => useVoiceSessionPersistence());
    let first!: Promise<string | null>; let end!: Promise<void>;
    act(() => {first = result.current.startSession();});
    await waitFor(() => expect(creates).toBe(1));
    act(() => {end = result.current.endSession('error');});
    await act(async () => {await result.current.startSession();});
    expect(result.current.currentSessionId).toBe(otherId);
    await act(async () => {pending.resolve({data: {id}, error: null}); await first; await end;});
    expect(result.current.currentSessionId).toBe(otherId);
    expect(mock.invoke.mock.calls.at(-1)?.[1].body.record_id).toBe(id);
  });
  it('keeps persistence failures nonblocking and does not update a missing row', async () => {
    mock.invoke.mockResolvedValue({data: null, error: new Error('synthetic failure')});
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {expect(await result.current.startSession()).toBeNull(); await result.current.endSession('error');});
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentSessionId).toBeNull();
    expect(mock.invoke).toHaveBeenCalledTimes(1);
  });
  it('leaves voice usable when browser storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {expect(await result.current.startSession()).toBeNull(); await result.current.endSession();});
    expect(result.current.isLoading).toBe(false);
    expect(mock.invoke).not.toHaveBeenCalled();
  });
  it('keeps authenticated creation and completion under owner RLS', async () => {
    mock.getUser.mockResolvedValue({data: {user: {id: 'owner'}}});
    const insert = vi.fn().mockReturnValue({select: () => ({single: async () => ({data: {id}, error: null})})});
    const eq = vi.fn().mockReturnValue({select: () => ({single: async () => ({data: {id}, error: null})})});
    const update = vi.fn().mockReturnValue({eq});
    mock.from.mockReturnValue({insert, update});
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {await result.current.startSession(); result.current.incrementMessageCount(); await result.current.endSession();});
    expect(insert.mock.calls[0][0].user_id).toBe('owner');
    expect(update.mock.calls[0][0].messages_exchanged).toBe(1);
    expect(eq).toHaveBeenCalledWith('id', id);
    expect(mock.invoke).not.toHaveBeenCalled();
  });
  it.each([null, {id: 'different-owner'}])('uses the captured session key after authentication changes to %j', async user => {
    mock.getUser.mockResolvedValueOnce({data: {user: {id: 'owner'}}}).mockResolvedValue({data: {user}});
    const insert = vi.fn().mockReturnValue({select: () => ({single: async () => ({data: {id}, error: null})})});
    const update = vi.fn();
    mock.from.mockReturnValue({insert, update});
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {await result.current.startSession();});
    const key = localStorage.getItem('voice_session_id');
    await act(async () => {
      await result.current.updateMotorContext({model: '90 ELPT', hp: 90});
      result.current.incrementMessageCount();
      await result.current.endSession();
    });
    expect(update).not.toHaveBeenCalled();
    expect(mock.invoke).toHaveBeenCalledTimes(2);
    expect(mock.invoke.mock.calls[0][1].body).toMatchObject({action: 'update', session_id: key, record_id: id,
      updates: {motor_context: {model: '90 ELPT', hp: 90}}});
    expect(mock.invoke.mock.calls[1][1].body).toMatchObject({action: 'update', session_id: key, record_id: id,
      updates: {messages_exchanged: 1, end_reason: 'user_ended'}});
  });
  it.each([
    {data: null, error: null},
    {data: null, error: new Error('RLS rejected the changed identity')},
  ])('retries an unconfirmed owner update through the session proxy', async response => {
    mock.getUser.mockResolvedValue({data: {user: {id: 'owner'}}});
    const insert = vi.fn().mockReturnValue({select: () => ({single: async () => ({data: {id}, error: null})})});
    const update = vi.fn().mockReturnValue({eq: () => ({select: () => ({single: async () => response})})});
    mock.from.mockReturnValue({insert, update});
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {await result.current.startSession(); result.current.incrementMessageCount(); await result.current.endSession('error');});
    expect(update).toHaveBeenCalledTimes(1);
    expect(mock.invoke).toHaveBeenCalledTimes(1);
    expect(mock.invoke.mock.calls[0][1].body).toMatchObject({action: 'update', record_id: id,
      session_id: localStorage.getItem('voice_session_id'), updates: {messages_exchanged: 1, end_reason: 'error'}});
  });
  it('saves completion through the session proxy when the current authentication check fails', async () => {
    mock.getUser.mockResolvedValueOnce({data: {user: {id: 'owner'}}}).mockRejectedValue(new Error('auth unavailable'));
    const insert = vi.fn().mockReturnValue({select: () => ({single: async () => ({data: {id}, error: null})})});
    const update = vi.fn();
    mock.from.mockReturnValue({insert, update});
    const {result} = renderHook(() => useVoiceSessionPersistence());
    await act(async () => {await result.current.startSession(); await result.current.endSession();});
    expect(update).not.toHaveBeenCalled();
    expect(mock.invoke.mock.calls[0][1].body).toMatchObject({action: 'update', record_id: id, updates: {end_reason: 'user_ended'}});
    expect(result.current.currentSessionId).toBeNull();
  });
});
