import { renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const mock = vi.hoisted(() => ({getUser: vi.fn(), invoke: vi.fn()}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {auth:{getUser:mock.getUser}, functions:{invoke:mock.invoke}}}));
import { useCrossChannelContext } from './useCrossChannelContext';
const voice = 'voice_' + 'a'.repeat(32);
const chat = 'chat_' + 'b'.repeat(64);
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  mock.getUser.mockResolvedValue({data:{user:null}});
});
afterEach(() => vi.unstubAllGlobals());
describe('voice and text context identities', () => {
  it('reads returning voice context with the dedicated voice id', async () => {
    localStorage.setItem('voice_session_id',voice);
    localStorage.setItem('chat_session_id',chat);
    mock.invoke.mockResolvedValue({data:{sessions:[{
      started_at:new Date().toISOString(),messages_exchanged:3,summary:null,motor_context:{model:'90 ELPT'},
    }]},error:null});
    const {result}=renderHook(() => useCrossChannelContext());
    expect(await result.current.loadVoiceContextForText()).toMatchObject({hasRecentVoice:true,messageCount:3,motorsDiscussed:['90 ELPT']});
    expect(mock.invoke).toHaveBeenCalledWith('voice-sessions-proxy',{body:{action:'list',session_id:voice,limit:3}});
    expect(localStorage.getItem('chat_session_id')).toBe(chat);
  });
  it('still reads text context with the text chat capability', async () => {
    localStorage.setItem('voice_session_id',voice);
    localStorage.setItem('chat_session_id',chat);
    const fetch = vi.fn().mockResolvedValue({ok:true,json:async () => ({conversation:null,messages:[]})});
    vi.stubGlobal('fetch',fetch);
    const {result}=renderHook(() => useCrossChannelContext());
    expect((await result.current.loadTextContextForVoice()).hasRecentText).toBe(false);
    expect(JSON.parse(fetch.mock.calls[0][1].body).session_id).toBe(chat);
    expect(mock.invoke).not.toHaveBeenCalled();
  });
});
