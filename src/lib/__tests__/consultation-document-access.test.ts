import { describe, expect, it, vi } from 'vitest';

import {
  captureConsultationFragmentToken,
  parseConsultationFragmentToken,
} from '@/lib/consultation-document-access';

const TOKEN = `cd_${'ab'.repeat(32)}`;

describe('consultation fragment capture', () => {
  it('reads the token only from the hash and removes it immediately', () => {
    const replaceState = vi.fn();
    const token = captureConsultationFragmentToken(
      { hash: `#${TOKEN}`, pathname: '/quote/document', search: '' },
      { replaceState },
    );

    expect(parseConsultationFragmentToken(`#${TOKEN}`)).toBe(TOKEN);
    expect(token).toBe(TOKEN);
    expect(replaceState).toHaveBeenCalledWith(null, '', '/quote/document');
    expect(parseConsultationFragmentToken('/quote/document?token=cd_ab')).toBeNull();
    expect(parseConsultationFragmentToken('not-a-token')).toBeNull();
  });
});
