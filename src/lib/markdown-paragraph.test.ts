import { describe, expect, it } from 'vitest';

import { isStandaloneMarkdownImageParagraph } from './markdown-paragraph';

describe('isStandaloneMarkdownImageParagraph', () => {
  it('unwraps a paragraph whose only child is an image', () => {
    expect(
      isStandaloneMarkdownImageParagraph({
        children: [{ type: 'element', tagName: 'img' }],
      }),
    ).toBe(true);
  });

  it('keeps ordinary and mixed-content paragraphs', () => {
    expect(
      isStandaloneMarkdownImageParagraph({
        children: [{ type: 'text' }],
      }),
    ).toBe(false);
    expect(
      isStandaloneMarkdownImageParagraph({
        children: [
          { type: 'text' },
          { type: 'element', tagName: 'img' },
        ],
      }),
    ).toBe(false);
  });
});
