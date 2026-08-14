import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readWorkspace = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('2026-08-14 fullstack audit fixes', () => {
  it('redirects /financing at the edge instead of serving homepage HTML', () => {
    const vercel = readWorkspace('../../vercel.json');

    expect(vercel).toContain('"source": "/financing"');
    expect(vercel).toContain('"destination": "/finance-calculator"');
    expect(vercel).not.toMatch(
      /"source":\s*"\/financing"\s*,\s*"destination":\s*"\/index\.html"/,
    );
  });

  it('requires an admin role on /admin/blog', () => {
    const app = readWorkspace('../App.tsx');

    expect(app).toContain(
      'path="/admin/blog" element={<SecureRoute requireAdmin={true}><AdminBlog />',
    );
  });

  it('publishes a www-canonical security.txt', () => {
    const securityTxt = readWorkspace('../../public/.well-known/security.txt');

    expect(securityTxt).toContain('https://www.mercuryrepower.ca/.well-known/security.txt');
    expect(securityTxt).not.toContain('quote.harrisboatworks.ca');
  });

  it('ships baseline security headers on all routes', () => {
    const vercel = readWorkspace('../../vercel.json');

    expect(vercel).toContain('"X-Content-Type-Options"');
    expect(vercel).toContain('"nosniff"');
    expect(vercel).toContain('"Referrer-Policy"');
    expect(vercel).toContain('"X-Frame-Options"');
    expect(vercel).toContain('"SAMEORIGIN"');
    expect(vercel).toContain('"Permissions-Policy"');
  });

  it('keeps language blog indexes in both sitemap sources', () => {
    const prerender = readWorkspace('../../scripts/static-prerender.mjs');
    const sitemap = readWorkspace('../utils/generateSitemap.ts');

    for (const loc of ['/blog/zh', '/blog/fr', '/blog/ko', '/blog/es', '/blog/hi', '/blog/pa']) {
      expect(prerender).toContain(`loc: '${loc}'`);
      expect(sitemap).toContain(`loc: '${loc}'`);
    }
  });
});
