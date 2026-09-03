import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const canonicalSlug = 'fourstroke-vs-pro-xs';
const staleSlug = 'mercury-motor-families-fourstroke-vs-pro-xs-vs-verado';

describe('Mercury family guide canonical route', () => {
  it('links the human and prerendered motor hubs directly to the canonical article', () => {
    const hub = source('src/pages/MotorSelectionHub.tsx');
    const prerender = source('scripts/static-prerender.mjs');
    const relatedPosts = source('src/lib/motor-related-blog-posts.ts');

    expect(hub).toContain(`/blog/${canonicalSlug}`);
    expect(prerender).toContain(`/blog/${canonicalSlug}`);
    expect(relatedPosts).toContain(`'${canonicalSlug}'`);
    expect(hub).not.toContain(`/blog/${staleSlug}`);
    expect(prerender).not.toContain(`/blog/${staleSlug}`);
    expect(relatedPosts).not.toContain(`'${staleSlug}'`);
  });

  it('publishes the canonical Markdown twin in both generator allowlists', () => {
    const twinGenerator = source('scripts/generate-markdown-twins.mjs');
    const prerender = source('scripts/static-prerender.mjs');

    expect(twinGenerator).toContain(`'${canonicalSlug}'`);
    expect(prerender).toContain(`'${canonicalSlug}'`);
    expect(twinGenerator).not.toContain(`'${staleSlug}'`);
    expect(prerender).not.toContain(`'${staleSlug}'`);
  });

  it('redirects legacy HTML and Markdown routes directly to canonical destinations', () => {
    const config = JSON.parse(source('vercel.json')) as {
      redirects?: Array<{ source: string; destination: string; statusCode: number }>;
    };
    const redirects = new Map(
      (config.redirects ?? []).map((redirect) => [redirect.source, redirect]),
    );

    expect(redirects.get(`/blog/${staleSlug}`)).toEqual({
      source: `/blog/${staleSlug}`,
      destination: `/blog/${canonicalSlug}`,
      statusCode: 301,
    });
    expect(redirects.get(`/blog/${staleSlug}.md`)).toEqual({
      source: `/blog/${staleSlug}.md`,
      destination: `/blog/${canonicalSlug}.md`,
      statusCode: 301,
    });
    expect(redirects.get('/blog/mercury-fourstroke-vs-verado-comparison')?.destination)
      .toBe(`/blog/${canonicalSlug}`);
    expect(redirects.get('/blog/mercury-fourstroke-vs-verado-comparison.md')).toEqual({
      source: '/blog/mercury-fourstroke-vs-verado-comparison.md',
      destination: `/blog/${canonicalSlug}.md`,
      statusCode: 301,
    });
    expect(redirects.has(`/blog/${canonicalSlug}`)).toBe(false);
    expect(redirects.has(`/blog/${canonicalSlug}.md`)).toBe(false);
  });
});
