// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';

import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  getSafeBlogImageSrc,
  processLocaleInlineMarkdown,
  renderStandaloneLocaleMarkdownImage,
} from './blogLocaleMarkdown';

const LOCALE_ARTICLE_PAGES = [
  'FrenchBlogArticlePage.tsx',
  'SpanishBlogArticlePage.tsx',
  'KoreanBlogArticlePage.tsx',
  'HindiBlogArticlePage.tsx',
  'UrduBlogArticlePage.tsx',
  'TagalogBlogArticlePage.tsx',
  'PunjabiBlogArticlePage.tsx',
];

function renderLocaleSnippet(content: string) {
  const lines = content.trim().split('\n');
  return render(
    <div>
      {lines.map((line, index) => {
        const standalone = renderStandaloneLocaleMarkdownImage(line, index);
        if (standalone) return standalone;
        if (!line.trim()) return null;
        return <p key={index}>{processLocaleInlineMarkdown(line)}</p>;
      })}
    </div>,
  );
}

describe('locale Markdown image rendering', () => {
  it('wires every custom locale parser through the shared image-safe helper', () => {
    for (const fileName of LOCALE_ARTICLE_PAGES) {
      const source = readFileSync(`src/pages/blog/${fileName}`, 'utf8');
      expect(source).toContain('processLocaleInlineMarkdown');
      expect(source).toContain('renderStandaloneLocaleMarkdownImage');
    }
  });

  it('renders a real ![alt](src) as an image with caption, not a leftover ! plus link', () => {
    const { container } = renderLocaleSnippet(
      '![Map showing Harris Boat Works in Gores Landing](/lovable-uploads/diagram-hbw-service-area-map.png)',
    );

    const image = screen.getByAltText(
      'Map showing Harris Boat Works in Gores Landing',
    );
    expect(image.tagName).toBe('IMG');
    expect(image).toHaveAttribute(
      'src',
      '/lovable-uploads/diagram-hbw-service-area-map.png',
    );
    expect(image).toHaveClass('w-full');
    expect(screen.getByText('Map showing Harris Boat Works in Gores Landing').tagName).toBe(
      'FIGCAPTION',
    );
    expect(container.textContent ?? '').not.toMatch(/^!/);
    expect(
      screen.queryByRole('link', {
        name: 'Map showing Harris Boat Works in Gores Landing',
      }),
    ).toBeNull();
    expect(
      container.querySelector('a[href="/lovable-uploads/diagram-hbw-service-area-map.png"]'),
    ).toBeNull();
  });

  it('keeps an explicit title caption and still uses alt on the image', () => {
    renderLocaleSnippet(
      '![Weight comparison](/lovable-uploads/inline/how-to-choose-horsepower.svg "Mercury HP by boat type")',
    );

    expect(screen.getByAltText('Weight comparison')).toHaveAttribute(
      'src',
      '/lovable-uploads/inline/how-to-choose-horsepower.svg',
    );
    expect(screen.getByText('Mercury HP by boat type').tagName).toBe('FIGCAPTION');
  });

  it('does not introduce an img or anchor for unsafe Markdown image URLs', () => {
    const unsafeSources = [
      "javascript:alert('xss')",
      'https://evil.example/track.png',
      '//evil.example/track.png',
      '/../etc/passwd.png',
      'data:image/png;base64,aaaa',
    ];

    for (const src of unsafeSources) {
      const { container, unmount } = renderLocaleSnippet(`![Unsafe diagram](${src})`);

      expect(screen.queryByRole('img')).toBeNull();
      expect(container.querySelector(`a[href="${src}"]`)).toBeNull();
      expect(screen.queryByRole('link', { name: 'Unsafe diagram' })).toBeNull();
      expect(getSafeBlogImageSrc(src)).toBeNull();
      expect(container).toHaveTextContent('Unsafe diagram');
      unmount();
    }
  });

  it('does not turn inline image markdown into a leftover ! plus text link', () => {
    const { container } = render(
      <p>
        {processLocaleInlineMarkdown(
          'See ![inline map](/lovable-uploads/diagram-hbw-service-area-map.png) nearby.',
        )}
      </p>,
    );

    expect(screen.getByAltText('inline map')).toHaveAttribute(
      'src',
      '/lovable-uploads/diagram-hbw-service-area-map.png',
    );
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('p figure')).toBeNull();
    expect(container.textContent ?? '').toContain('See');
    expect(container.textContent ?? '').toContain('nearby.');
    expect(container.textContent ?? '').not.toContain('!');
  });

  it('preserves bold and ordinary links around a safe image', () => {
    const { container } = renderLocaleSnippet(
      [
        '![Service-area map](/lovable-uploads/diagram-hbw-service-area-map.png)',
        '',
        'See **Mercury** pricing and [build a quote](/quote/motor-selection).',
      ].join('\n'),
    );

    expect(screen.getByAltText('Service-area map')).toBeInTheDocument();
    expect(container.querySelector('strong')).toHaveTextContent('Mercury');
    const quoteLink = screen.getByRole('link', { name: 'build a quote' });
    expect(quoteLink).toHaveAttribute('href', '/quote/motor-selection');
    expect(quoteLink).not.toHaveAttribute('target');
    expect(container.textContent ?? '').not.toContain('![');
  });
});
