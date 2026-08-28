// @vitest-environment happy-dom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatWriteConsentCard } from './ChatWriteConsentCard';
import type { ChatPendingWrite } from './chatSessionHelpers';

const executeConfirmedChatWrite = vi.hoisted(() => vi.fn());

vi.mock('./chatSessionHelpers', async () => {
  const actual = await vi.importActual<typeof import('./chatSessionHelpers')>('./chatSessionHelpers');
  return {
    ...actual,
    executeConfirmedChatWrite: (...args: unknown[]) => executeConfirmedChatWrite(...args),
  };
});

const write: ChatPendingWrite = {
  kind: 'lead',
  title: 'Have Harris call you back?',
  description: 'We will pass this to the Harris team. Nothing is sent until you confirm.',
  details: [
    { label: 'Name', value: 'Jay' },
    { label: 'Phone', value: '905-555-1234' },
  ],
  payload: { name: 'Jay', phone: '905-555-1234' },
};

describe('ChatWriteConsentCard', () => {
  beforeEach(() => {
    executeConfirmedChatWrite.mockReset();
  });

  it('does not write on render or after the customer cancels', () => {
    const onStatusChange = vi.fn();
    executeConfirmedChatWrite.mockResolvedValue(undefined);

    render(
      <ChatWriteConsentCard write={write} status="needs_consent" onStatusChange={onStatusChange} />,
    );

    expect(executeConfirmedChatWrite).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel contact request' }));
    expect(onStatusChange).toHaveBeenCalledWith('declined');
    expect(executeConfirmedChatWrite).not.toHaveBeenCalled();

    // Even before a parent rerender removes the buttons, Cancel wins the decision race.
    fireEvent.click(screen.getByRole('button', { name: 'Confirm callback request' }));
    expect(executeConfirmedChatWrite).not.toHaveBeenCalled();
  });

  it('writes once only after explicit confirmation and blocks duplicate taps', async () => {
    const onStatusChange = vi.fn();
    let resolveWrite: (() => void) | undefined;
    executeConfirmedChatWrite.mockImplementation(() => new Promise<void>((resolve) => {
      resolveWrite = resolve;
    }));

    render(
      <ChatWriteConsentCard write={write} status="needs_consent" onStatusChange={onStatusChange} />,
    );

    const confirm = screen.getByRole('button', { name: 'Confirm callback request' });
    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onStatusChange).toHaveBeenCalledWith('sending');
    expect(executeConfirmedChatWrite).toHaveBeenCalledTimes(1);

    resolveWrite?.();
    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith('sent');
    });
  });

  it('unlocks the same consent card after a rejected write so the customer can retry', async () => {
    const onStatusChange = vi.fn();
    executeConfirmedChatWrite.mockRejectedValueOnce(new Error('network'));

    const { rerender } = render(
      <ChatWriteConsentCard write={write} status="needs_consent" onStatusChange={onStatusChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm callback request' }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('error'));

    rerender(<ChatWriteConsentCard write={write} status="error" onStatusChange={onStatusChange} />);
    executeConfirmedChatWrite.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm callback request' }));

    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('sent'));
    expect(executeConfirmedChatWrite).toHaveBeenCalledTimes(2);
  });
});
