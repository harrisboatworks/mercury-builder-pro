import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readWorkspace = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const vercelConfig = JSON.parse(readWorkspace('../../vercel.json')) as {
  redirects: Array<{ source: string; destination: string; statusCode?: number }>;
  rewrites: Array<{ source: string; destination: string }>;
  headers: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
};

const countLiteral = (source: string, literal: string) => source.split(literal).length - 1;

describe('verified route, security, and sitemap fixes', () => {
  it('redirects /financing at the edge without a homepage rewrite', () => {
    expect(vercelConfig.redirects).toContainEqual({
      source: '/financing',
      destination: '/finance-calculator',
      statusCode: 301,
    });
    expect(vercelConfig.rewrites).not.toContainEqual({
      source: '/financing',
      destination: '/index.html',
    });
  });

  it('requires the admin role for /admin/blog', () => {
    const app = readWorkspace('../App.tsx');

    expect(app).toContain(
      'path="/admin/blog" element={<SecureRoute requireAdmin={true}><AdminBlog />',
    );
  });

  it('publishes the www security.txt canonical', () => {
    const securityTxt = readWorkspace('../../public/.well-known/security.txt');

    expect(securityTxt).toContain(
      'Canonical: https://www.mercuryrepower.ca/.well-known/security.txt',
    );
    expect(securityTxt).not.toContain('quote.harrisboatworks.ca');
  });

  it('adds the proven-safe baseline security headers without disabling voice', () => {
    const globalHeaders = vercelConfig.headers.find(({ source }) => source === '/(.*)');
    const headers = Object.fromEntries(
      (globalHeaders?.headers ?? []).map(({ key, value }) => [key, value]),
    );

    expect(headers).toMatchObject({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'camera=(), geolocation=()',
    });
    expect(headers['Permissions-Policy']).not.toContain('microphone');
  });

  it('lists every indexable language blog hub once in both sitemap sources', () => {
    const app = readWorkspace('../App.tsx');
    const prerender = readWorkspace('../../scripts/static-prerender.mjs');
    const sitemap = readWorkspace('../utils/generateSitemap.ts');
    const indexableLanguageHubs = [
      '/blog/zh',
      '/blog/fr',
      '/blog/ko',
      '/blog/es',
      '/blog/hi',
      '/blog/pa',
      '/blog/ur',
      '/blog/tl',
    ];

    for (const loc of indexableLanguageHubs) {
      expect(app).toContain(`path="${loc}"`);
      expect(countLiteral(prerender, `loc: '${loc}'`)).toBe(1);
      expect(countLiteral(sitemap, `loc: '${loc}'`)).toBe(1);
    }

    expect(prerender).not.toContain("loc: '/blog/zh-hant'");
    expect(sitemap).not.toContain("loc: '/blog/zh-hant'");
  });
});
