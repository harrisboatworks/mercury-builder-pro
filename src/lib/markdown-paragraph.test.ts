import { describe, expect, it } from 'vitest';

import { shouldUnwrapMarkdownImageParagraph } from './markdown-paragraph';

describe('shouldUnwrapMarkdownImageParagraph', () => {
  it('unwraps a paragraph whose only child is an image', () => {
    expect(
      shouldUnwrapMarkdownImageParagraph({
        children: [{ type: 'element', tagName: 'img' }],
      }),
    ).toBe(true);
  });

  it('unwraps an image followed by an inline caption', () => {
    expect(
      shouldUnwrapMarkdownImageParagraph({
        children: [
          { type: 'element', tagName: 'img' },
          { type: 'text' },
          { type: 'element', tagName: 'em' },
        ],
      }),
    ).toBe(true);
  });

  it('keeps ordinary paragraphs', () => {
    expect(
      shouldUnwrapMarkdownImageParagraph({
        children: [{ type: 'text' }],
      }),
    ).toBe(false);
  });
});
