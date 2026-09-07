import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeBlock, tokenizeCodeBlock } from './CodeBlock';

const RAW_SAMPLES = {
  json: '{"ok":true,"script":"<script>alert(1)</script>","path":"C:\\\\quotes","n":300,"amp":"a&b"}',
  bash: `curl -X POST "https://example.com/api?q=1&x=2" \\\n  -H 'X-Test: <script>' \\\n  --data '{"a":1}'`,
  url: 'https://www.mercuryrepower.ca/quote/motor-selection?motor=abc&boat_make=Lund // note',
};

function visibleCode(container: HTMLElement): HTMLElement {
  const code = container.querySelector('code');
  if (!code) throw new Error('code element missing');
  return code;
}

function mockClipboard(writeText: ReturnType<typeof vi.fn>) {
  const clipboard = { writeText };
  try {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: clipboard,
    });
  } catch {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
  }
}

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document, "execCommand", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(Object.entries(RAW_SAMPLES))(
    'keeps %s textContent equal to the raw input and inserts no executable markup',
    (language, raw) => {
      const { container } = render(
        <CodeBlock language={language as 'json' | 'bash' | 'url'}>{raw}</CodeBlock>,
      );
      const code = visibleCode(container);

      expect(tokenizeCodeBlock(raw, language as 'json' | 'bash' | 'url').map((token) => token.text).join('')).toBe(raw);
      expect(code.textContent).toBe(raw);
      expect(container.querySelector('script')).toBeNull();
      expect(code.querySelector('script')).toBeNull();
      expect(code.innerHTML).not.toContain('<script>');
      expect(code.textContent).not.toContain('text-sky-300');
      expect(code.textContent).not.toContain('text-amber-300');
    },
  );

  it('copies the exact raw input and shows Copied only after clipboard success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const { container } = render(
      <CodeBlock language="json">{RAW_SAMPLES.json}</CodeBlock>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(RAW_SAMPLES.json);
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
    expect(visibleCode(container).textContent).toBe(RAW_SAMPLES.json);
    expect(screen.queryByTestId('code-block-copy-status')).not.toBeInTheDocument();
  });

  it('treats a successful execCommand fallback as success', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    mockClipboard(writeText);
    vi.spyOn(document, 'execCommand').mockReturnValue(true);

    render(<CodeBlock language="bash">{RAW_SAMPLES.bash}</CodeBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    });
  });

  it('shows an accessible failure status when both copy mechanisms fail', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    mockClipboard(writeText);
    vi.spyOn(document, 'execCommand').mockReturnValue(false);

    render(<CodeBlock language="url">{RAW_SAMPLES.url}</CodeBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Copy failed');
      expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Copied' })).not.toBeInTheDocument();
  });

  it('clears the copied timer on unmount', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);

    const { unmount } = render(<CodeBlock>{RAW_SAMPLES.bash}</CodeBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();

    unmount();
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
  });
});
