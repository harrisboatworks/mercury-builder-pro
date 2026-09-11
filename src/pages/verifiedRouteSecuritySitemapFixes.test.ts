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

    expect(vercelConfig.rewrites).toContainEqual({
      source: '/finance-calculator',
      destination: '/finance-calculator/index.html',
    });
    expect(readWorkspace('../App.tsx')).toContain(
      'path="/finance-calculator" element={<FinanceCalculator />}',
    );
  });

  it('requires the database-backed admin role before /admin/blog can mount', () => {
    const app = readWorkspace('../App.tsx');
    const secureRoute = readWorkspace('../components/auth/SecureRoute.tsx');
    const authProvider = readWorkspace('../components/auth/AuthProvider.tsx');

    expect(app).toContain(
      'path="/admin/blog" element={<SecureRoute requireAdmin={true}><AdminBlog />',
    );
    expect(secureRoute).toContain('loading || (requireAdmin && adminLoading)');
    expect(secureRoute).toContain('if (requireAdmin && !isAdmin)');
    expect(secureRoute.indexOf('if (requireAdmin && !isAdmin)')).toBeLessThan(
      secureRoute.indexOf('return <>{children}</>'),
    );
    expect(authProvider).toContain("supabase.rpc('has_role'");
    expect(authProvider).toContain("_role: 'admin'");
  });

  it('publishes the www security.txt canonical', () => {
    const securityTxt = readWorkspace('../../public/.well-known/security.txt');

    expect(securityTxt).toContain(
      'Canonical: https://www.mercuryrepower.ca/.well-known/security.txt',
    );
    expect(securityTxt).not.toContain('quote.harrisboatworks.ca');

    const expires = securityTxt.match(/^Expires:\s*(.+)$/m)?.[1];
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(expires).toBeTruthy();
    // RFC 9116 files must remain current. Fail with a 30-day renewal window
    // instead of waiting until the canonical security contact has expired.
    expect(Date.parse(expires!)).toBeGreaterThan(Date.now() + thirtyDays);
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
      'Permissions-Policy': 'camera=(), geolocation=(self)',
    });
    expect(headers['Permissions-Policy']).not.toContain('microphone');
  });

  it('lists every indexable language blog hub once in both sitemap sources', () => {
    const app = readWorkspace('../App.tsx');
    const prerender = readWorkspace('../../scripts/static-prerender.mjs');
    const sitemap = readWorkspace('../utils/generateSitemap.ts');
    const indexableLanguageHubs = [
      { route: '/blog/zh', component: 'Zh', lang: 'zh-Hans' },
      { route: '/blog/fr', component: 'Fr', lang: 'fr' },
      { route: '/blog/ko', component: 'Ko', lang: 'ko' },
      { route: '/blog/es', component: 'Es', lang: 'es' },
      { route: '/blog/hi', component: 'Hi', lang: 'hi' },
      { route: '/blog/pa', component: 'Pa', lang: 'pa' },
      { route: '/blog/ur', component: 'Ur', lang: 'ur' },
      { route: '/blog/tl', component: 'Tl', lang: 'tl' },
    ];

    for (const { route, component, lang } of indexableLanguageHubs) {
      const page = readWorkspace(`./blog/BlogIndex${component}.tsx`);

      expect(app).toContain(`path="${route}"`);
      expect(countLiteral(prerender, `loc: '${route}'`)).toBe(1);
      expect(countLiteral(sitemap, `loc: '${route}'`)).toBe(1);
      expect(page).toContain(`lang="${lang}"`);
      expect(page).toContain('rel="canonical"');
      expect(page).not.toContain('name="robots" content="noindex');
    }

    expect(prerender).not.toContain("loc: '/blog/zh-hant'");
    expect(sitemap).not.toContain("loc: '/blog/zh-hant'");
    expect(readWorkspace('./blog/BlogIndexZhHant.tsx')).toContain(
      '<meta name="robots" content="noindex,follow" />',
    );
  });
});
